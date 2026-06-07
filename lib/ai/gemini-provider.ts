// Gemini 2.5 Flash provider implementation

import { AIProvider } from './types';
import { AIExtractionResponse, AIExtractionResponseSchema } from './schema';
import { EXTRACTION_PROMPT } from './extraction-prompt';

// Use Gemini 2.5 Flash (1.5 was shut down in 2026)
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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

    console.log('Making request to:', GEMINI_API_ENDPOINT);
    console.log('API Key format:', apiKey.substring(0, 10) + '...');

    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
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
    // With responseMimeType: 'application/json', the response should be pure JSON (no markdown)
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
