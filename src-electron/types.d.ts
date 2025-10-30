export interface ContextSettings {
  maxPages?: number;
  maxBlocksPerPage?: number;
  maxTotalBlocks?: number;
  searchResultLimit?: number;
  relevanceThreshold?: number;
  includeBlocks?: 'all' | 'matched' | 'top';
  excludeNamespaces?: string[];
  dateRangeDays?: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ pageName: string; excerpt: string; filePath?: string }>;
  noContextWarning?: boolean;
  action?: {
    type: 'create_journal' | 'create_page' | 'append_to_page';
    date?: string;
    pageName?: string;
    content: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface ConversationMetadata {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  lastMessagePreview?: string;
}

export interface Settings {
  logseqPath: string;
  apiKey?: string; // Deprecated - use providers.groq.apiKey instead
  model?: string; // Deprecated - use providers.groq.model instead
  provider: 'groq' | 'openai' | 'anthropic' | 'ollama';
  providers: {
    groq?: { apiKey: string; model: string };
    openai?: { apiKey: string; model: string };
    anthropic?: { apiKey: string; model: string };
    ollama?: { endpoint: string; model: string };
  };
  theme: 'light' | 'dark' | 'system';
  contextSettings?: ContextSettings;
}

export interface PageContent {
  pageName: string;
  path: string;
  frontmatter: Record<string, unknown>;
  blocks: Array<{
    id?: string;
    content: string;
    level: number;
    properties: Record<string, string>;
    tags: string[];
    references: string[];
    blockRefs: string[];
  }>;
  allTags: string[];
  allProperties: Record<string, string>;
}

export interface ElectronAPI {
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
  search: (query: string) => Promise<Array<{ pageName: string; score: number; excerpt: string; blocks: Array<{ content: string; id?: string }> }>>;
  getPage: (pageName: string) => Promise<PageContent | null>;
  getJournal: (dateStr: string) => Promise<PageContent | null>;
  rebuildIndex: () => Promise<{ files: number; journalFiles: number }>;
  getIndexStats: () => Promise<{ pages: number; journals: number }>;
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

