export interface ElectronAPI {
  getSettings: () => Promise<Settings>;
  setSettings: (settings: Partial<Settings>) => Promise<Settings>;
  browseDirectory: () => Promise<string | null>;
  scanDirectory: (path: string) => Promise<string[]>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  watchDirectory: (path: string) => Promise<void>;
  onFileChange: (callback: (data: { event: string; filePath: string }) => void) => void;
  chat: (messages: Array<{ role: string; content: string }>, context: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string }> }> | undefined) => Promise<string>;
  search: (query: string) => Promise<SearchResult[]>;
  createJournalEntry: (date: string, content: string) => Promise<string>;
  createPage: (pageName: string, content: string) => Promise<string>;
  appendToPage: (pageName: string, content: string) => Promise<string>;
}

export interface Settings {
  logseqPath: string;
  apiKey: string;
  model: string;
  provider: 'groq';
  theme: 'light' | 'dark' | 'system';
}

export interface SearchResult {
  pageName: string;
  score: number;
  excerpt: string;
  blocks: Array<{ content: string; id?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

