import Store from 'electron-store';
import { Settings } from '../types';

const defaultSettings: Settings = {
  logseqPath: '',
  apiKey: '',
  model: 'llama-3.3-70b-versatile',
  provider: 'groq',
  theme: 'system',
};

// Deprecated models and their replacements per https://console.groq.com/docs/deprecations
const deprecatedModelMap: Record<string, string> = {
  'mixtral-8x7b-32768': 'llama-3.3-70b-versatile', // Deprecated March 20, 2025
  'llama-3.1-70b-versatile': 'llama-3.3-70b-versatile', // Deprecated January 24, 2025
  'moonshotai/kimi-k2-instruct': 'moonshotai/kimi-k2-instruct-0905', // Deprecated October 10, 2025
};

const store = new Store<Settings>({
  name: 'settings',
  defaults: defaultSettings,
});

function migrateDeprecatedModels(settings: Settings): Settings {
  // Auto-migrate deprecated models to their replacements
  if (settings.model && deprecatedModelMap[settings.model]) {
    const replacement = deprecatedModelMap[settings.model];
    console.log(`Migrating deprecated model ${settings.model} to ${replacement}`);
    store.set('model', replacement);
    return { ...settings, model: replacement };
  }
  return settings;
}

export function getSettings(): Settings {
  const settings = store.store;
  return migrateDeprecatedModels(settings);
}

export function setSettings(updates: Partial<Settings>): void {
  store.set(updates);
}

