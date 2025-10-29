import { useEffect, useState } from 'react';
import { Settings, ContextSettings } from '../types';
import './SettingsPanel.css';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onSave: () => void;
}

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
  
  const handleChange = (key: keyof Settings, value: string | ContextSettings) => {
    onChange({ ...settings, [key]: value });
  };

  const handleContextChange = (key: keyof ContextSettings, value: number | string | string[]) => {
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
            title="Rescan your LogSeq folder and rebuild the in-memory index"
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

