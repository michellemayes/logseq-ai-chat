import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI, Settings, PageContent } from './types';

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
  chat: (messages: Array<{ role: string; content: string }>, context: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string }> }> | undefined) => ipcRenderer.invoke('chat', messages, context),
  
  // Search
  search: (query: string) => ipcRenderer.invoke('search', query),
  
  // Graph queries
  getPage: (pageName: string) => ipcRenderer.invoke('get-page', pageName) as Promise<PageContent | null>,
  getJournal: (dateStr: string) => ipcRenderer.invoke('get-journal', dateStr) as Promise<PageContent | null>,
  
  // Content creation
  createJournalEntry: (date: string, content: string) => ipcRenderer.invoke('create-journal-entry', date, content),
  createPage: (pageName: string, content: string) => ipcRenderer.invoke('create-page', pageName, content),
  appendToPage: (pageName: string, content: string) => ipcRenderer.invoke('append-to-page', pageName, content),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

