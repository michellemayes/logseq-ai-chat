import { useEffect, useState } from 'react';
import { Settings, ContextSettings } from '../types';
import './SettingsPanel.css';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onSave: () => void;
}

const PROVIDER_MODELS: Record<string, { label: string; value: string }[]> = {
  groq: [
    { label: 'Llama 3.3 70B Versatile (Recommended)', value: 'llama-3.3-70b-versatile' },
    { label: 'Mistral Saba 24B', value: 'mistral-saba-24b' },
    { label: 'GPT OSS 120B', value: 'openai/gpt-oss-120b' },
    { label: 'Kimi K2 0905 Instruct', value: 'moonshotai/kimi-k2-instruct-0905' },
    { label: 'Llama 3.1 8B Instant', value: 'llama-3.1-8b-instant' },
  ],
  openai: [
    { label: 'GPT-4', value: 'gpt-4' },
    { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
  ],
  anthropic: [
    { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
    { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
    { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
  ],
  ollama: [
    { label: 'Llama 2', value: 'llama2' },
    { label: 'Mistral', value: 'mistral' },
    { label: 'Code Llama', value: 'codellama' },
  ],
};

export default function SettingsPanel({ settings, onChange, onSave }: SettingsPanelProps) {
  const [stats, setStats] = useState<{ pages: number; journals: number } | null>(null);
  const [contextExpanded, setContextExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    window.electronAPI
      .getIndexStats()
      .then((s) => { if (mounted) setStats(s); })
      .catch(() => { if (mounted) setStats({ pages: 0, journals: 0 }); });
    return () => { mounted = false; };
  }, [settings.logseqPath]);
  
  const handleChange = (key: keyof Settings, value: string | ContextSettings | undefined) => {
    if (value === undefined) {
      const updated = { ...settings };
      delete (updated as any)[key];
      onChange(updated);
    } else {
      onChange({ ...settings, [key]: value });
    }
  };

  const handleProviderChange = (provider: 'groq' | 'openai' | 'anthropic' | 'ollama') => {
    const providers = settings.providers || {};
    // Ensure provider config exists
    if (!providers[provider]) {
      if (provider === 'ollama') {
        providers[provider] = { endpoint: 'http://localhost:11434', model: 'llama2' };
      } else {
        providers[provider] = { apiKey: '', model: PROVIDER_MODELS[provider]?.[0]?.value || '' };
      }
    }
    onChange({ ...settings, provider, providers });
  };

  const handleProviderConfigChange = (provider: 'groq' | 'openai' | 'anthropic' | 'ollama', key: string, value: string) => {
    const providers = settings.providers || {};
    const updatedProviders = { ...providers };
    
    if (!updatedProviders[provider]) {
      if (provider === 'ollama') {
        updatedProviders[provider] = { endpoint: 'http://localhost:11434', model: 'llama2' };
      } else {
        updatedProviders[provider] = { apiKey: '', model: PROVIDER_MODELS[provider]?.[0]?.value || '' };
      }
    }
    
    // Update the specific field
    const currentConfig = updatedProviders[provider]!;
    if (provider === 'ollama') {
      updatedProviders[provider] = { ...currentConfig as { endpoint: string; model: string }, [key]: value };
    } else {
      updatedProviders[provider] = { ...currentConfig as { apiKey: string; model: string }, [key]: value };
    }
    
    onChange({ ...settings, providers: updatedProviders });
  };

  const handleContextChange = (key: keyof ContextSettings, value: number | string | string[] | undefined) => {
    const contextSettings: ContextSettings = {
      ...settings.contextSettings,
      [key]: value,
    };
    handleChange('contextSettings', contextSettings);
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

  const contextSettings = settings.contextSettings || {
    maxPages: 5,
    maxBlocksPerPage: 50,
    maxTotalBlocks: 100,
    searchResultLimit: 5,
    relevanceThreshold: 1,
    includeBlocks: 'all' as const,
  };

  const currentProvider = settings.provider || 'groq';
  const providerConfig = settings.providers?.[currentProvider];
  const providerModels = PROVIDER_MODELS[currentProvider] || [];

  return (
    <div className="settings-panel">
      <div className="settings-section">
        <label className="settings-label">Logseq Graph Path</label>
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
        <label className="settings-label">LLM Provider</label>
        <select
          className="settings-select"
          value={currentProvider}
          onChange={(e) => handleProviderChange(e.target.value as 'groq' | 'openai' | 'anthropic' | 'ollama')}
        >
          <option value="groq">Groq</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="ollama">Ollama</option>
        </select>
      </div>

      {currentProvider !== 'ollama' && (
        <div className="settings-section">
          <label className="settings-label">
            {currentProvider === 'groq' ? 'Groq' : currentProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API Key
          </label>
          <input
            type="password"
            className="settings-input"
            value={providerConfig && 'apiKey' in providerConfig ? providerConfig.apiKey : ''}
            onChange={(e) => handleProviderConfigChange(currentProvider, 'apiKey', e.target.value)}
            placeholder={`Enter your ${currentProvider === 'groq' ? 'Groq' : currentProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API key`}
          />
        </div>
      )}

      {currentProvider === 'ollama' && (
        <div className="settings-section">
          <label className="settings-label">Ollama Endpoint</label>
          <input
            type="text"
            className="settings-input"
            value={providerConfig && 'endpoint' in providerConfig ? providerConfig.endpoint : 'http://localhost:11434'}
            onChange={(e) => handleProviderConfigChange(currentProvider, 'endpoint', e.target.value)}
            placeholder="http://localhost:11434"
          />
        </div>
      )}

      <div className="settings-section">
        <label className="settings-label">Model</label>
        <select
          className="settings-select"
          value={providerConfig?.model || providerModels[0]?.value || ''}
          onChange={(e) => handleProviderConfigChange(currentProvider, 'model', e.target.value)}
        >
          {providerModels.map((model) => (
            <option key={model.value} value={model.value}>
              {model.label}
            </option>
          ))}
        </select>
      </div>

      <div className="settings-section">
        <label className="settings-label">Primary Color</label>
        <div className="settings-color-picker-group">
          <input
            type="color"
            className="settings-color-picker"
            value={settings.primaryColor || (settings.theme === 'dark' ? '#8B6F8F' : '#6B4E71')}
            onChange={(e) => handleChange('primaryColor', e.target.value)}
          />
          <input
            type="text"
            className="settings-input settings-color-input"
            value={settings.primaryColor || ''}
            onChange={(e) => handleChange('primaryColor', e.target.value || undefined)}
            placeholder={settings.theme === 'dark' ? '#8B6F8F' : '#6B4E71'}
            pattern="^#[0-9A-Fa-f]{6}$"
          />
          <button
            className="settings-button settings-reset-color-button"
            onClick={() => handleChange('primaryColor', undefined)}
            title="Reset to default theme color"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="settings-section">
        <button
          className="settings-expand-button"
          onClick={() => setContextExpanded(!contextExpanded)}
          type="button"
        >
          {contextExpanded ? '▼' : '▶'} Context Settings
        </button>
        {contextExpanded && (
          <div className="settings-subsection">
            <div className="settings-subsection-item">
              <label className="settings-label" title="Maximum number of pages to include in context">
                Max Pages
              </label>
              <input
                type="number"
                className="settings-input"
                min="1"
                max="20"
                value={contextSettings.maxPages || 5}
                onChange={(e) => handleContextChange('maxPages', parseInt(e.target.value) || 5)}
              />
            </div>
            <div className="settings-subsection-item">
              <label className="settings-label" title="Maximum blocks per page to include">
                Max Blocks Per Page
              </label>
              <input
                type="number"
                className="settings-input"
                min="1"
                max="200"
                value={contextSettings.maxBlocksPerPage || 50}
                onChange={(e) => handleContextChange('maxBlocksPerPage', parseInt(e.target.value) || 50)}
              />
            </div>
            <div className="settings-subsection-item">
              <label className="settings-label" title="Maximum total blocks across all context">
                Max Total Blocks
              </label>
              <input
                type="number"
                className="settings-input"
                min="1"
                max="500"
                value={contextSettings.maxTotalBlocks || 100}
                onChange={(e) => handleContextChange('maxTotalBlocks', parseInt(e.target.value) || 100)}
              />
            </div>
            <div className="settings-subsection-item">
              <label className="settings-label" title="Maximum search results to include">
                Search Result Limit
              </label>
              <input
                type="number"
                className="settings-input"
                min="1"
                max="20"
                value={contextSettings.searchResultLimit || 5}
                onChange={(e) => handleContextChange('searchResultLimit', parseInt(e.target.value) || 5)}
              />
            </div>
            <div className="settings-subsection-item">
              <label className="settings-label" title="Minimum relevance score to include results">
                Relevance Threshold
              </label>
              <input
                type="number"
                className="settings-input"
                min="0"
                max="10"
                value={contextSettings.relevanceThreshold || 1}
                onChange={(e) => handleContextChange('relevanceThreshold', parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="settings-subsection-item">
              <label className="settings-label" title="How to select blocks within pages">
                Block Filtering Mode
              </label>
              <select
                className="settings-select"
                value={contextSettings.includeBlocks || 'all'}
                onChange={(e) => handleContextChange('includeBlocks', e.target.value as 'all' | 'matched' | 'top')}
              >
                <option value="all">All blocks</option>
                <option value="matched">Only matching blocks</option>
                <option value="top">Top scoring blocks</option>
              </select>
            </div>
            <div className="settings-subsection-item">
              <label className="settings-label" title="Exclude pages in these namespaces (comma-separated)">
                Exclude Namespaces
              </label>
              <input
                type="text"
                className="settings-input"
                value={contextSettings.excludeNamespaces?.join(', ') || ''}
                onChange={(e) => {
                  const namespaces = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                  handleContextChange('excludeNamespaces', namespaces);
                }}
                placeholder="e.g., archive, templates"
              />
            </div>
            <div className="settings-subsection-item">
              <label className="settings-label" title="Only include journals within this many days (leave empty for all)">
                Date Range (days)
              </label>
              <input
                type="number"
                className="settings-input"
                min="1"
                value={contextSettings.dateRangeDays || ''}
                onChange={(e) => handleContextChange('dateRangeDays', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 30"
              />
            </div>
          </div>
        )}
      </div>

      <div className="settings-actions">
        <button className="settings-save-button" onClick={onSave}>
          Save Settings
        </button>
        <div className="settings-center-row">
          <button
            className="settings-button"
            onClick={async () => {
              try {
                const result = await window.electronAPI.rebuildIndex();
                console.log('[Settings] Rebuild index complete:', result);
                // Update stats from current index after rebuild
                try {
                  const s = await window.electronAPI.getIndexStats();
                  setStats(s);
                } catch {}
              } catch (e) {
                console.error('Failed to rebuild index:', e);
              }
            }}
            title="Rescan your Logseq folder and rebuild the in-memory index"
          >
            Rebuild Index
          </button>
        </div>
        <div className="settings-center-row stats-row">
          <span className="stats-text">
            {stats ? `${stats.pages} pages • ${stats.journals} journals` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
