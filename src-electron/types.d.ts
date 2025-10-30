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
  primaryColor?: string; // Custom primary color (hex format)
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

export interface TraversalResult {
  pageName: string;
  hopLevel: number;
}

export interface RelatedPageResult {
  pageName: string;
  connectionStrength: number;
  connectionTypes: string[];
}

export interface OrphanedPage {
  pageName: string;
  path: string;
  hasTags: boolean;
}

export interface BlockWithPage {
  block: {
    id?: string;
    content: string;
    level: number;
    properties: Record<string, string>;
    tags: string[];
    references: string[];
    blockRefs: string[];
  };
  pageName: string;
  blockIndex: number;
  parentPage: PageContent;
  siblingBlocks?: Array<{
    id?: string;
    content: string;
    level: number;
    properties: Record<string, string>;
    tags: string[];
    references: string[];
    blockRefs: string[];
  }>;
}

export interface JournalDateRange {
  startDate: Date;
  endDate: Date;
}

export interface JournalWithDate extends PageContent {
  date: Date;
  dateStr: string;
}

export interface JournalComparison {
  date1: string;
  date2: string;
  contentSimilarity: number;
  sharedTags: string[];
  uniqueTags1: string[];
  uniqueTags2: string[];
  blockCount1: number;
  blockCount2: number;
  sharedKeywords: string[];
}

export interface JournalPattern {
  type: 'tag' | 'topic' | 'content' | 'temporal';
  pattern: string;
  frequency: number;
  examples: string[];
  description: string;
}

export interface TaskBlock {
  id?: string;
  content: string;
  level: number;
  properties: Record<string, string>;
  tags: string[];
  references: string[];
  blockRefs: string[];
  taskStatus: 'TODO' | 'DOING' | 'DONE' | 'LATER' | 'NOW' | 'WAITING' | 'CANCELED';
  pageName: string;
}

export interface TaskSummary {
  date: string;
  totalTasks: number;
  byStatus: {
    TODO: number;
    DOING: number;
    DONE: number;
    LATER: number;
    NOW: number;
    WAITING: number;
    CANCELED: number;
  };
  tasks: TaskBlock[];
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
  getBlockById: (blockId: string) => Promise<BlockWithPage | null>;
  getBlockWithContext: (blockId: string) => Promise<BlockWithPage | null>;
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
  // Temporal queries
  queryJournalsByDateRange: (startDateStr: string, endDateStr: string) => Promise<JournalWithDate[]>;
  queryJournalsLastWeek: () => Promise<JournalWithDate[]>;
  queryJournalsLastMonth: () => Promise<JournalWithDate[]>;
  queryJournalsLastNDays: (days: number) => Promise<JournalWithDate[]>;
  parseDateRange: (query: string) => Promise<JournalDateRange | null>;
  compareJournals: (date1: string, date2: string) => Promise<JournalComparison | null>;
  detectJournalPatterns: (dateStrings: string[]) => Promise<JournalPattern[]>;
  // Task queries
  queryTasksByStatus: (status: string, options?: { pageName?: string; dateRange?: { start: string; end: string } }) => Promise<TaskBlock[]>;
  queryTasksByPage: (pageName: string) => Promise<TaskBlock[]>;
  queryTasksByDateRange: (startDateStr: string, endDateStr: string) => Promise<TaskBlock[]>;
  queryTasksDueThisWeek: () => Promise<TaskBlock[]>;
  queryTasksDueBetween: (startDateStr: string, endDateStr: string) => Promise<TaskBlock[]>;
  getTaskSummary: (dateStr: string) => Promise<TaskSummary | null>;
  updateTaskStatus: (pageName: string, blockId: string, newStatus: string) => Promise<{ success: boolean }>;
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

