// Provider registry for swappable AI providers

import { AIProvider } from './types';
import { GeminiProvider } from './gemini-provider';

const providers = new Map<string, AIProvider>();

// Register default providers
providers.set('gemini', new GeminiProvider());

export function getProvider(name: string = 'gemini'): AIProvider {
  const provider = providers.get(name);
  if (!provider) {
    throw new Error(`Provider '${name}' not found`);
  }
  return provider;
}

export function registerProvider(provider: AIProvider): void {
  providers.set(provider.name, provider);
}

export function listProviders(): string[] {
  return Array.from(providers.keys());
}
