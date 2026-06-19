// Gemini 2.5 Flash provider implementation

import { AIProvider } from './types';
import { AIExtractionResponse, AIExtractionResponseSchema } from './schema';
import { getExtractionPrompt } from './extraction-prompt';
import { getSettings } from '../storage/settings';

// Default model. Users can switch to gemini-2.5-flash-lite in settings for
// faster (and cheaper) extraction at slightly lower quality
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const getGeminiEndpoint = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

export class GeminiProvider implements AIProvider {
  name = 'gemini';

  async extractEvents(imageBase64: string, apiKey: string): Promise<AIExtractionResponse> {
    const settings = await getSettings();
    const model = settings.geminiModel || DEFAULT_GEMINI_MODEL;

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: getExtractionPrompt()
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        // Gemini 2.5 Flash runs dynamic "thinking" by default, which adds
        // significant latency and burns output tokens. Structured extraction
        // with a strict schema doesn't need it
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        // Schema with all event fields including recurrence
        responseSchema: {
          type: 'object',
          properties: {
            events: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  location: { type: 'string' },
                  startDate: { type: 'string' },
                  endDate: { type: 'string' },
                  isAllDay: { type: 'boolean' },
                  recurrence: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      frequency: { type: 'string', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] },
                      interval: { type: 'integer' },
                      count: { type: 'integer' },
                      until: { type: 'string' },
                      byDay: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['frequency']
                  },
                  reminders: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        method: { type: 'string', enum: ['email', 'popup'] },
                        minutes: { type: 'integer' }
                      },
                      required: ['method', 'minutes']
                    }
                  }
                },
                required: ['title', 'startDate', 'endDate', 'isAllDay']
              }
            }
          },
          required: ['events']
        }
      }
    };

    // Retry with exponential backoff for rate limit errors
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 2s, 4s, 8s
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`Retrying Gemini request (attempt ${attempt + 1}/${maxRetries + 1}) after ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        console.log(`Using model: ${model}`);
        const result = await this.makeRequest(model, requestBody, apiKey);
        console.log(`Success with model: ${model}`);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, lastError.message);

        // Retry on temporary errors (high demand) or quota errors
        const shouldRetry = error instanceof Error && (
          error.message.includes('high demand') ||
          error.message.includes('quota') ||
          error.message.includes('UNAVAILABLE')
        );

        if (!shouldRetry || attempt === maxRetries) {
          throw lastError;
        }

        // For high demand errors, log that we're retrying
        if (error instanceof Error && error.message.includes('high demand')) {
          console.log('Gemini service is busy, retrying with backoff...');
        }
      }
    }

    throw lastError || new Error('Failed after retries');
  }

  private async makeRequest(
    model: string,
    requestBody: any,
    apiKey: string
  ): Promise<AIExtractionResponse> {
    const endpoint = getGeminiEndpoint(model);

    // Send the key via the x-goog-api-key header (the documented method).
    // The legacy ?key= query parameter breaks with Google's newer 'AQ.'
    // format auth keys - Google misreads them as OAuth tokens and returns
    // 401 "Request had invalid authentication credentials"
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('API Error Response:', JSON.stringify(error, null, 2));
      console.error('Status:', response.status);

      const errorMessage = error.error?.message || '';

      // 503: Temporary service unavailability (high demand on Google's servers)
      if (response.status === 503 || errorMessage.includes('high demand') || errorMessage.includes('UNAVAILABLE')) {
        throw new Error('Gemini is experiencing high demand. Please wait a moment and try again.');
      }

      // 429: Rate limit/quota exceeded (user hit their quota)
      if (response.status === 429 || errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('Quota exceeded')) {
        throw new Error('You\'ve reached your Gemini API quota. Please try again later or check your API key limits at ai.google.dev');
      }

      // 400/401/403 key problems: don't pass Google's raw message through -
      // it mentions OAuth credentials, which misleads users into thinking
      // their Google account is the problem
      if (response.status === 401 || response.status === 403 || errorMessage.includes('API key not valid')) {
        throw new Error(
          'Gemini rejected your API key. Please check it in Settings, or create a new key at aistudio.google.com/app/apikey.'
        );
      }

      throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini');
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    if (!textResponse) {
      throw new Error('Empty response from Gemini');
    }

    // Parse and validate the JSON response
    try {
      // Log response length for debugging
      console.log(`Response length: ${textResponse.length} characters`);

      // Check if response appears truncated
      const trimmed = textResponse.trim();
      if (trimmed.length > 0) {
        const lastChar = trimmed[trimmed.length - 1];
        if (lastChar !== '}' && lastChar !== ']') {
          console.error('Response appears truncated, last char:', lastChar);
          throw new Error(
            'The AI response was cut off. This usually means the image contains too many events or complex details. ' +
            'Try capturing a simpler view or fewer events at once.'
          );
        }
      }

      const jsonResponse = JSON.parse(textResponse);
      const validated = AIExtractionResponseSchema.parse(jsonResponse);
      return validated;
    } catch (error) {
      console.error('Failed to parse response. Length:', textResponse.length);
      console.error('First 500 chars:', textResponse.substring(0, 500));
      console.error('Last 500 chars:', textResponse.substring(Math.max(0, textResponse.length - 500)));
      console.error('Parse error:', error);

      // Check if response was truncated
      if (error instanceof SyntaxError && error.message.includes('Unterminated')) {
        throw new Error(
          'The AI response was cut off. This usually means the image contains too many events or complex details. ' +
          'Try capturing a simpler view or fewer events at once.'
        );
      }

      if (error instanceof SyntaxError) {
        throw new Error(
          'The AI generated invalid data format. This can happen with complex images. ' +
          'Try again, or try capturing a simpler view with fewer events.'
        );
      }

      throw new Error(`Invalid response format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
