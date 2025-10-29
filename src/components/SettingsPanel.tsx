import { Settings } from '../types';
import './SettingsPanel.css';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onSave: () => void;
}

export default function SettingsPanel({ settings, onChange, onSave }: SettingsPanelProps) {
  const handleChange = (key: keyof Settings, value: string) => {
    onChange({ ...settings, [key]: value });
  };

  const handleBrowsePath = async () => {
    try {
      const path = await window.electronAPI.browseDirectory();
      if (path) {
        handleChange('logseqPath', path);
      }
    } catch (error) {
      console.error('Failed to browse directory:', error);
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-section">
        <label className="settings-label">LogSeq Graph Path</label>
        <div className="settings-input-group">
          <input
            type="text"
            className="settings-input"
            value={settings.logseqPath}
            onChange={(e) => handleChange('logseqPath', e.target.value)}
            placeholder="/path/to/logseq/graph"
          />
          <button className="settings-button" onClick={handleBrowsePath}>
            Browse
          </button>
        </div>
      </div>

      <div className="settings-section">
        <label className="settings-label">Groq API Key</label>
        <input
          type="password"
          className="settings-input"
          value={settings.apiKey}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          placeholder="Enter your Groq API key"
        />
      </div>

      <div className="settings-section">
        <label className="settings-label">Model</label>
        <select
          className="settings-select"
          value={settings.model}
          onChange={(e) => handleChange('model', e.target.value)}
        >
          <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Recommended)</option>
          <option value="mistral-saba-24b">Mistral Saba 24B</option>
          <option value="openai/gpt-oss-120b">GPT OSS 120B</option>
          <option value="moonshotai/kimi-k2-instruct-0905">Kimi K2 0905 Instruct</option>
          <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
        </select>
      </div>

      <div className="settings-actions">
        <button className="settings-save-button" onClick={onSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
}

