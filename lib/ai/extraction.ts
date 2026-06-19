// Main extraction function used by service worker

import { AIExtractionResponse } from './schema';
import { getProvider } from './provider-registry';
import { dataUrlToBase64 } from '../../entrypoints/background/capture';
import { getSettings } from '../storage/settings';

// Track last request time for throttling
let lastRequestTime = 0;
const THROTTLE_DELAY_MS = 1000; // 1 second between requests

export interface ExtractionResult extends AIExtractionResponse {
  usedProvider?: 'gemini' | 'openai';
  usedFallback?: boolean;
}

export async function extractEventsFromImage(imageDataUrl: string): Promise<ExtractionResult> {
  // Throttle requests to avoid rate limits
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < THROTTLE_DELAY_MS) {
    const delayMs = THROTTLE_DELAY_MS - timeSinceLastRequest;
    console.log(`Throttling request, waiting ${delayMs}ms...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  lastRequestTime = Date.now();

  // Get settings from storage
  const settings = await getSettings();

  const providerName = settings.provider || 'gemini';

  // Optimize image based on provider
  // Gemini prefers smaller images (768px), OpenAI can handle larger (1280px)
  const maxWidth = providerName === 'gemini' ? 768 : 1280;
  console.log('Optimizing image for', providerName, 'maxWidth:', maxWidth);
  const optimizedDataUrl = await resizeImage(imageDataUrl, maxWidth, 70);
  console.log('Image optimized, new size:', optimizedDataUrl.length, 'bytes');

  // Use selected provider
  if (providerName === 'gemini') {
    const geminiApiKey = settings.geminiApiKey || await getDefaultGeminiKey();

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured. Please add it in Settings.');
    }

    const provider = getProvider('gemini');
    const base64Image = dataUrlToBase64(optimizedDataUrl);
    const result = await provider.extractEvents(base64Image, geminiApiKey);
    return { ...result, usedProvider: 'gemini', usedFallback: false };
  }

  // Use OpenAI
  if (providerName === 'openai') {
    const openaiApiKey = settings.openaiApiKey;

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please add it in Settings.');
    }

    const provider = getProvider('openai');
    const base64Image = dataUrlToBase64(optimizedDataUrl);
    const result = await provider.extractEvents(base64Image, openaiApiKey);
    return { ...result, usedProvider: 'openai', usedFallback: false };
  }

  throw new Error('No API key configured. Please configure Gemini or OpenAI in Settings.');
}

// Resize image to reduce token count (service worker compatible)
async function resizeImage(dataUrl: string, maxWidth: number, quality: number): Promise<string> {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Create ImageBitmap (available in service workers)
    const imageBitmap = await createImageBitmap(blob);

    const originalWidth = imageBitmap.width;
    const originalHeight = imageBitmap.height;

    // Already small enough (e.g. selection captures are downscaled during
    // cropping) - skip the redundant decode/re-encode entirely
    if (originalWidth <= maxWidth) {
      imageBitmap.close();
      return dataUrl;
    }

    const targetWidth = maxWidth;
    const targetHeight = Math.floor(originalHeight * (maxWidth / originalWidth));

    // Create canvas and resize
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.warn('Failed to get canvas context, returning original image');
      return dataUrl;
    }

    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

    // Convert to JPEG blob with specified quality
    const resizedBlob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: quality / 100
    });

    // Convert blob back to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(resizedBlob);
    });
  } catch (error) {
    console.error('Image resize failed, using original:', error);
    return dataUrl;
  }
}

// Get default free-tier Gemini key (embedded in extension for convenience)
// Users can override with their own paid key for higher limits
async function getDefaultGeminiKey(): Promise<string> {
  // For now, require users to get their own free key
  // In the future, could embed a shared key with clear rate limit warnings
  return '';
}
