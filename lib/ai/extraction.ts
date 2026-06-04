// Main extraction function used by service worker

import { AIExtractionResponse } from './schema';
import { getProvider } from './provider-registry';
import { dataUrlToBase64 } from '../../entrypoints/background/capture';
import { getSettings } from '../storage/settings';

export async function extractEventsFromImage(imageDataUrl: string): Promise<AIExtractionResponse> {
  // Get settings from storage
  const settings = await getSettings();

  const providerName = settings.provider || 'local';

  // API key is optional for local provider
  if (providerName !== 'local' && !settings.apiKey) {
    throw new Error('API key not configured. Please configure it in the extension options.');
  }

  // Get the AI provider
  const provider = getProvider(providerName);

  // Convert data URL to base64
  const base64Image = dataUrlToBase64(imageDataUrl);

  // Extract events using the provider
  const result = await provider.extractEvents(base64Image, settings.apiKey || '');

  return result;
}
