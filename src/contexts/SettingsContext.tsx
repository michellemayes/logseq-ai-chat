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

