import Store from 'electron-store';
import { Settings, ContextSettings } from '../types';

const defaultSettings: Settings = {
  logseqPath: '',
  provider: 'groq',
  providers: {
    groq: {
      apiKey: '',
      model: 'llama-3.3-70b-versatile',
    },
  },
  theme: 'system',
};

export const defaultContextSettings: ContextSettings = {
  maxPages: 5,
  maxBlocksPerPage: 50,
  maxTotalBlocks: 100,
  searchResultLimit: 5,
  relevanceThreshold: 1,
  includeBlocks: 'all',
};

export function getContextSettings(): ContextSettings {
  const settings = getSettings();
  return settings.contextSettings || defaultContextSettings;
}

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

function migrateSettings(settings: Partial<Settings>): Settings {
  const migrated: Settings = {
    logseqPath: settings.logseqPath || '',
    provider: settings.provider || 'groq',
    providers: settings.providers || {},
    theme: settings.theme || 'system',
    ...(settings.contextSettings && { contextSettings: settings.contextSettings }),
  };

  // Migrate deprecated apiKey/model to providers.groq structure
  if (settings.apiKey || settings.model) {
    console.log('[settings] Migrating legacy Groq settings to providers structure');
    if (!migrated.providers.groq) {
      migrated.providers.groq = {
        apiKey: settings.apiKey || '',
        model: settings.model || 'llama-3.3-70b-versatile',
      };
    } else {
      // Merge with existing provider config
      migrated.providers.groq.apiKey = settings.apiKey || migrated.providers.groq.apiKey;
      migrated.providers.groq.model = settings.model || migrated.providers.groq.model;
    }
    // Set provider to groq if not set
    if (!migrated.provider) {
      migrated.provider = 'groq';
    }
    // Write migrated settings back (only include contextSettings if it exists)
    const settingsToStore: Partial<Settings> = {
      ...migrated,
    };
    if (!settingsToStore.contextSettings) {
      delete settingsToStore.contextSettings;
    }
    store.set(settingsToStore);
    // Clear deprecated fields
    store.delete('apiKey');
    store.delete('model');
  }

  // Migrate deprecated models
  if (migrated.providers.groq?.model && deprecatedModelMap[migrated.providers.groq.model]) {
    const replacement = deprecatedModelMap[migrated.providers.groq.model];
    console.log(`[settings] Migrating deprecated model ${migrated.providers.groq.model} to ${replacement}`);
    migrated.providers.groq.model = replacement;
    store.set('providers.groq.model', replacement);
  }

  return migrated as Settings;
}

export function getSettings(): Settings {
  const rawSettings = store.store;
  const migrated = migrateSettings(rawSettings);
  return migrated;
}

export function setSettings(updates: Partial<Settings>): void {
  const currentSettings = getSettings();
  const updatedSettings: Partial<Settings> = { ...currentSettings };
  
  // Only include defined values
  if (updates.logseqPath !== undefined) updatedSettings.logseqPath = updates.logseqPath;
  if (updates.provider !== undefined) updatedSettings.provider = updates.provider;
  if (updates.providers !== undefined) updatedSettings.providers = updates.providers;
  if (updates.theme !== undefined) updatedSettings.theme = updates.theme;
  if (updates.contextSettings !== undefined) updatedSettings.contextSettings = updates.contextSettings;
  
  // Remove undefined contextSettings if it was explicitly set to undefined
  if ('contextSettings' in updates && updates.contextSettings === undefined) {
    delete updatedSettings.contextSettings;
  }
  
  store.set(updatedSettings);
}

