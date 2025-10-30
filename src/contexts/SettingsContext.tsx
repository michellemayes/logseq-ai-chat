import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Settings } from '../types';

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    logseqPath: '',
    provider: 'groq',
    providers: {
      groq: {
        apiKey: '',
        model: 'llama-3.3-70b-versatile',
      },
    },
    theme: 'system',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const loaded = await window.electronAPI.getSettings();
        setSettings(loaded);
        console.log('[SettingsContext] Loaded settings, primaryColor:', loaded.primaryColor);
        // Apply primary color immediately when settings are loaded
        const root = document.documentElement;
        const theme = loaded.theme === 'system' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : loaded.theme;
        const defaultColor = theme === 'dark' ? '#8B6F8F' : '#6B4E71';
        const accentColor = loaded.primaryColor || defaultColor;
        root.style.setProperty('--accent', accentColor);
        console.log('[SettingsContext] Applied accent color:', accentColor);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      const updated = await window.electronAPI.setSettings(updates);
      setSettings(updated);
      // Apply primary color immediately when settings are updated
      const root = document.documentElement;
      const theme = updated.theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : updated.theme;
      const defaultColor = theme === 'dark' ? '#8B6F8F' : '#6B4E71';
      if (updated.primaryColor) {
        root.style.setProperty('--accent', updated.primaryColor);
      } else {
        root.style.setProperty('--accent', defaultColor);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

