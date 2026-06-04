// Gemini 2.5 Flash provider implementation

import { AIProvider } from './types';
import { AIExtractionResponse, AIExtractionResponseSchema } from './schema';
import { EXTRACTION_PROMPT } from './extraction-prompt';

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

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
                data: imageBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json'
      }
    };

    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
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
      throw new Error(`Invalid response format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
