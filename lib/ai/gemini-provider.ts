// Gemini 2.5 Flash provider implementation

import { AIProvider } from './types';
import { AIExtractionResponse, AIExtractionResponseSchema } from './schema';
import { EXTRACTION_PROMPT } from './extraction-prompt';

// Use Gemini 2.5 Flash (1.5 was shut down in 2026)
// Falls back to 3.5 Flash if 2.5 is experiencing high demand
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.5-flash'  // Fallback if 2.5 is overloaded
];

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
    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: EXTRACTION_PROMPT
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
        maxOutputTokens: 4096,
        responseMimeType: 'application/json'  // Force JSON output (no markdown wrapping)
      }
    };

    // Try each model with retry logic
    let lastError: Error | null = null;

    for (const model of GEMINI_MODELS) {
      try {
        console.log(`Attempting with model: ${model}`);
        const result = await this.makeRequest(model, requestBody, apiKey);
        console.log(`Success with model: ${model}`);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Failed with ${model}:`, error instanceof Error ? error.message : error);

        // If it's a high demand error (503), try the next model
        if (error instanceof Error && error.message.includes('high demand')) {
          console.log('High demand detected, trying alternative model...');
          continue;
        }

        // For other errors, throw immediately
        throw error;
      }
    }

    // If all models failed, throw the last error
    throw lastError || new Error('All Gemini models failed');
  }

  private async makeRequest(
    model: string,
    requestBody: any,
    apiKey: string
  ): Promise<AIExtractionResponse> {
    const endpoint = getGeminiEndpoint(model);

    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('API Error Response:', JSON.stringify(error, null, 2));
      console.error('Status:', response.status);

      // Check for high demand error (503)
      if (response.status === 503 ||
          (error.error?.message && error.error.message.includes('high demand'))) {
        throw new Error('This model is currently experiencing high demand');
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
      const jsonResponse = JSON.parse(textResponse);
      const validated = AIExtractionResponseSchema.parse(jsonResponse);
      return validated;
    } catch (error) {
      console.error('Failed to parse response:', textResponse);
      console.error('Parse error:', error);
      throw new Error(`Invalid response format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
