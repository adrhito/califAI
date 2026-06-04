// Provider registry for swappable AI providers

import { AIProvider } from './types';
import { OpenAIProvider } from './openai-provider';
import { GeminiProvider } from './gemini-provider';
import { LocalProvider } from './local-provider';

const providers = new Map<string, AIProvider>();

// Register default providers
providers.set('openai', new OpenAIProvider());
providers.set('gemini', new GeminiProvider());
providers.set('local', new LocalProvider());

export function getProvider(name: string = 'openai'): AIProvider {
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
