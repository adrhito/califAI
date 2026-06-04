// OpenAI GPT-4 Vision provider implementation

import { AIProvider } from './types';
import { AIExtractionResponse, AIExtractionResponseSchema } from './schema';
import { EXTRACTION_PROMPT } from './extraction-prompt';

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
              text: EXTRACTION_PROMPT
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.2
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
      let jsonText = textResponse;
      const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else {
        const codeMatch = textResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          jsonText = codeMatch[1];
        }
      }

      const jsonResponse = JSON.parse(jsonText);
      const validated = AIExtractionResponseSchema.parse(jsonResponse);
      return validated;
    } catch (error) {
      console.error('Failed to parse response:', textResponse);
      throw new Error(`Invalid response format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
