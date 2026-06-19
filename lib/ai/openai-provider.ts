// OpenAI GPT-4 Vision provider implementation

import { AIProvider } from './types';
import { AIExtractionResponse, AIExtractionResponseSchema } from './schema';
import { getExtractionPrompt } from './extraction-prompt';

const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

interface OpenAIResponse {
  choices?: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
    type: string;
  };
}

export class OpenAIProvider implements AIProvider {
  name = 'openai';

  async extractEvents(imageBase64: string, apiKey: string): Promise<AIExtractionResponse> {
    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: getExtractionPrompt()
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high' // Use high-detail for accurate text extraction
              }
            }
          ]
        }
      ],
      max_tokens: 2048, // Increased to handle multiple complex events
      temperature: 0.2,
      response_format: { type: "json_object" } // Enforce JSON output
    };

    console.log('Making request to:', OPENAI_API_ENDPOINT);
    console.log('Using model: gpt-4o-mini');

    const response = await fetch(OPENAI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('API Error Response:', JSON.stringify(error, null, 2));
      console.error('Status:', response.status);
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data: OpenAIResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    const textResponse = data.choices[0].message.content;
    if (!textResponse) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse and validate the JSON response
    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = textResponse.trim();
      const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      } else {
        const codeMatch = textResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          jsonText = codeMatch[1].trim();
        }
      }

      // Check if response was truncated (incomplete JSON)
      if (jsonText.length > 0) {
        const lastChar = jsonText[jsonText.length - 1];
        if (lastChar !== '}' && lastChar !== ']') {
          console.error('Response appears truncated, last char:', lastChar);
          console.error('Response length:', jsonText.length);
          throw new Error(
            'The AI response was cut off. This usually means the image contains too many events or complex details. ' +
            'Try capturing a simpler view or fewer events at once.'
          );
        }
      }

      let jsonResponse = JSON.parse(jsonText);

      // Handle if OpenAI returns an array directly instead of wrapped in {events: [...]}
      if (Array.isArray(jsonResponse)) {
        console.warn('OpenAI returned array directly, wrapping in expected format');
        jsonResponse = {
          events: jsonResponse,
          reasoning: 'Extracted events from image'
        };
      }

      const validated = AIExtractionResponseSchema.parse(jsonResponse);
      return validated;
    } catch (error) {
      console.error('Failed to parse response. Length:', textResponse.length);
      console.error('First 200 chars:', textResponse.substring(0, 200));
      console.error('Last 200 chars:', textResponse.substring(Math.max(0, textResponse.length - 200)));
      console.error('Parse error:', error);

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
