import { contextBridge, ipcRenderer } from 'electron';
import { Settings, PageContent } from './types';

interface ElectronAPI {
  getSettings: () => Promise<Settings>;
  setSettings: (settings: Partial<Settings>) => Promise<Settings>;
  browseDirectory: () => Promise<string | null>;
  scanDirectory: (path: string) => Promise<string[]>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  watchDirectory: (path: string) => Promise<void>;
  onFileChange: (callback: (data: { event: string; filePath: string }) => void) => void;
  chat: (messages: Array<{ role: string; content: string }>, context: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }> | undefined) => Promise<string>;
  search: (query: string) => Promise<any[]>;
  getPage: (pageName: string) => Promise<PageContent | null>;
  getJournal: (dateStr: string) => Promise<PageContent | null>;
  rebuildIndex: () => Promise<{ files: number; journalFiles: number }>;
  getIndexStats: () => Promise<{ pages: number; journals: number }>;
  openFile: (filePath: string) => Promise<void>;
  createJournalEntry: (date: string, content: string) => Promise<string>;
  createPage: (pageName: string, content: string) => Promise<string>;
  appendToPage: (pageName: string, content: string) => Promise<string>;
}

const electronAPI: ElectronAPI = {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (settings: Partial<Settings>) => ipcRenderer.invoke('set-settings', settings),
  browseDirectory: () => ipcRenderer.invoke('browse-directory'),
  
  // File system
  scanDirectory: (path: string) => ipcRenderer.invoke('scan-directory', path),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
  watchDirectory: (path: string) => ipcRenderer.invoke('watch-directory', path),
  onFileChange: (callback: (data: { event: string; filePath: string }) => void) => {
    ipcRenderer.on('file-change', (_event, data: { event: string; filePath: string }) => callback(data));
  },
  
  // LLM
  chat: (messages: Array<{ role: string; content: string }>, context: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }> | undefined) => ipcRenderer.invoke('chat', messages, context),
  
  // Search
  search: (query: string) => ipcRenderer.invoke('search', query),
  rebuildIndex: () => ipcRenderer.invoke('rebuild-index'),
  getIndexStats: () => ipcRenderer.invoke('get-index-stats'),
  
  // Graph queries
  getPage: (pageName: string) => ipcRenderer.invoke('get-page', pageName) as Promise<PageContent | null>,
  getJournal: (dateStr: string) => ipcRenderer.invoke('get-journal', dateStr) as Promise<PageContent | null>,
  
  // File operations
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
  
  // Content creation
  createJournalEntry: (date: string, content: string) => ipcRenderer.invoke('create-journal-entry', date, content),
  createPage: (pageName: string, content: string) => ipcRenderer.invoke('create-page', pageName, content),
  appendToPage: (pageName: string, content: string) => ipcRenderer.invoke('append-to-page', pageName, content),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

