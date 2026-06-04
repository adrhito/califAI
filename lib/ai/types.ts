// AI provider interface for swappable providers

import { AIExtractionResponse } from './schema';

export interface AIProvider {
  name: string;
  extractEvents(imageBase64: string, apiKey: string): Promise<AIExtractionResponse>;
}
