import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import SettingsPanel from './SettingsPanel';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      // Ensure color is applied after save
      const root = document.documentElement;
      const theme = localSettings.theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : localSettings.theme;
      const defaultColor = theme === 'dark' ? '#8B6F8F' : '#6B4E71';
      if (localSettings.primaryColor) {
        root.style.setProperty('--accent', localSettings.primaryColor);
      } else {
        root.style.setProperty('--accent', defaultColor);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <SettingsPanel
          settings={localSettings}
          onChange={setLocalSettings}
          onSave={handleSave}
        />
      </div>
    </>
  );
}

