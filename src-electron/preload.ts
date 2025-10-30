import { contextBridge, ipcRenderer } from 'electron';
import { Settings, PageContent, Conversation, ConversationMetadata, TraversalResult, RelatedPageResult, OrphanedPage } from './types';

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
  chatStream: (
    messages: Array<{ role: string; content: string }>,
    context: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }> | undefined,
    callbacks: {
      onToken: (token: string) => void;
      onComplete: (fullContent: string) => void;
      onError: (error: string) => void;
    }
  ) => void;
  search: (query: string) => Promise<any[]>;
  getPage: (pageName: string) => Promise<PageContent | null>;
  getJournal: (dateStr: string) => Promise<PageContent | null>;
  rebuildIndex: () => Promise<{ files: number; journalFiles: number }>;
  getIndexStats: () => Promise<{ pages: number; journals: number }>;
  // Graph traversal
  getConnectedPages: (pageName: string) => Promise<string[]>;
  traverseGraph: (pageName: string, maxHops?: number) => Promise<TraversalResult[]>;
  findRelatedPages: (pageName: string, options?: { maxHops?: number; minConnections?: number }) => Promise<RelatedPageResult[]>;
  findOrphanedPages: (options?: { includeTagged?: boolean }) => Promise<OrphanedPage[]>;
  openFile: (filePath: string) => Promise<void>;
  createJournalEntry: (date: string, content: string) => Promise<string>;
  createPage: (pageName: string, content: string) => Promise<string>;
  appendToPage: (pageName: string, content: string) => Promise<string>;
  // Conversations
  getConversations: () => Promise<ConversationMetadata[]>;
  getConversation: (id: string) => Promise<Conversation | null>;
  createConversation: (title: string) => Promise<Conversation>;
  saveConversation: (conversation: Conversation) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  getActiveConversationId: () => Promise<string | null>;
  setActiveConversationId: (id: string | null) => Promise<void>;
  searchConversations: (query: string) => Promise<ConversationMetadata[]>;
  clearAllConversations: () => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  exportConversation: (id: string, defaultPath?: string) => Promise<string | null>;
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
  chatStream: (
    messages: Array<{ role: string; content: string }>,
    context: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }> | undefined,
    callbacks: {
      onToken: (token: string) => void;
      onComplete: (fullContent: string) => void;
      onError: (error: string) => void;
    }
  ) => {
    // Set up event listeners with named handlers so we can remove them selectively
    const tokenHandler = (_event: any, data: { token: string }) => {
      callbacks.onToken(data.token);
    };
    
    // Cleanup function to remove all listeners for this stream
    // This will be called after handlers are assigned
    const cleanup = () => {
      ipcRenderer.removeListener('chat-stream-token', tokenHandler);
      ipcRenderer.removeListener('chat-stream-end', endHandler);
      ipcRenderer.removeListener('chat-stream-error', errorHandler);
      ipcRenderer.removeListener('chat-stream-fallback', fallbackHandler);
    };
    
    const endHandler = (_event: any, data: { fullContent: string }) => {
      cleanup();
      callbacks.onComplete(data.fullContent);
    };
    
    const errorHandler = (_event: any, data: { error: string }) => {
      cleanup();
      callbacks.onError(data.error);
    };
    
    const fallbackHandler = (_event: any, data: { response: string }) => {
      cleanup();
      callbacks.onComplete(data.response);
    };

    // Register listeners before starting stream to avoid race conditions
    ipcRenderer.on('chat-stream-token', tokenHandler);
    ipcRenderer.on('chat-stream-end', endHandler);
    ipcRenderer.on('chat-stream-error', errorHandler);
    ipcRenderer.on('chat-stream-fallback', fallbackHandler);

    // Start streaming
    ipcRenderer.send('chat-stream-start', { messages, context });
  },
  
  // Search
  search: (query: string) => ipcRenderer.invoke('search', query),
  rebuildIndex: () => ipcRenderer.invoke('rebuild-index'),
  getIndexStats: () => ipcRenderer.invoke('get-index-stats'),
  
  // Graph queries
  getPage: (pageName: string) => ipcRenderer.invoke('get-page', pageName) as Promise<PageContent | null>,
  getJournal: (dateStr: string) => ipcRenderer.invoke('get-journal', dateStr) as Promise<PageContent | null>,
  
  // Graph traversal
  getConnectedPages: (pageName: string) => ipcRenderer.invoke('get-connected-pages', pageName) as Promise<string[]>,
  traverseGraph: (pageName: string, maxHops?: number) => ipcRenderer.invoke('traverse-graph', pageName, maxHops) as Promise<TraversalResult[]>,
  findRelatedPages: (pageName: string, options?: { maxHops?: number; minConnections?: number }) => ipcRenderer.invoke('find-related-pages', pageName, options) as Promise<RelatedPageResult[]>,
  findOrphanedPages: (options?: { includeTagged?: boolean }) => ipcRenderer.invoke('find-orphaned-pages', options) as Promise<OrphanedPage[]>,
  
  // File operations
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
  
  // Content creation
  createJournalEntry: (date: string, content: string) => ipcRenderer.invoke('create-journal-entry', date, content),
  createPage: (pageName: string, content: string) => ipcRenderer.invoke('create-page', pageName, content),
  appendToPage: (pageName: string, content: string) => ipcRenderer.invoke('append-to-page', pageName, content),
  
  // Conversations
  getConversations: () => ipcRenderer.invoke('get-conversations') as Promise<ConversationMetadata[]>,
  getConversation: (id: string) => ipcRenderer.invoke('get-conversation', id) as Promise<Conversation | null>,
  createConversation: (title: string) => ipcRenderer.invoke('create-conversation', title) as Promise<Conversation>,
  saveConversation: (conversation: Conversation) => ipcRenderer.invoke('save-conversation', conversation) as Promise<Conversation>,
  deleteConversation: (id: string) => ipcRenderer.invoke('delete-conversation', id),
  getActiveConversationId: () => ipcRenderer.invoke('get-active-conversation-id') as Promise<string | null>,
  setActiveConversationId: (id: string | null) => ipcRenderer.invoke('set-active-conversation-id', id),
  searchConversations: (query: string) => ipcRenderer.invoke('search-conversations', query) as Promise<ConversationMetadata[]>,
  clearAllConversations: () => ipcRenderer.invoke('clear-all-conversations'),
  updateConversationTitle: (id: string, title: string) => ipcRenderer.invoke('update-conversation-title', id, title),
  exportConversation: (id: string, defaultPath?: string) => ipcRenderer.invoke('export-conversation', id, defaultPath) as Promise<string | null>,
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

