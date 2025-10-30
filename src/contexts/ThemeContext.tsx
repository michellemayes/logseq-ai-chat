import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSettings } from './SettingsContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): Theme {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function getEffectiveTheme(settingsTheme: 'light' | 'dark' | 'system'): Theme {
  if (settingsTheme === 'system') {
    return getSystemTheme();
  }
  return settingsTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const [theme, setTheme] = useState<Theme>(() => getEffectiveTheme(settings.theme));

  useEffect(() => {
    setTheme(getEffectiveTheme(settings.theme));
    
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => setTheme(getSystemTheme());
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Apply custom primary color if set, otherwise use theme default
    // Setting via inline style on documentElement will override CSS rules
    const defaultColor = theme === 'dark' ? '#8B6F8F' : '#6B4E71';
    const accentColor = settings.primaryColor || defaultColor;
    root.style.setProperty('--accent', accentColor);
    console.log('[ThemeContext] Applied accent color:', accentColor, 'theme:', theme, 'primaryColor:', settings.primaryColor);
  }, [theme, settings.primaryColor]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    await updateSettings({ theme: newTheme });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

