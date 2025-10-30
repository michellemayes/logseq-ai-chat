import { readMarkdownFile, parseMarkdown } from '../filesystem/scanner';
import { parseLogseqContent, getAllBlocks } from './parser';

export interface IndexedPage {
  path: string;
  name: string;
  frontmatter: Record<string, unknown>;
  blocks: Array<{
    id?: string;
    content: string;
    level: number;
    properties: Record<string, string>;
    tags: string[];
    references: string[];
    blockRefs: string[];
    taskStatus?: 'TODO' | 'DOING' | 'DONE' | 'LATER' | 'NOW' | 'WAITING' | 'CANCELED';
  }>;
  allTags: string[];
  allProperties: Record<string, string>;
  modificationDate: Date;
  taskCounts?: {
    TODO: number;
    DOING: number;
    DONE: number;
    LATER: number;
    NOW: number;
    WAITING: number;
    CANCELED: number;
  };
}

export interface GraphIndex {
  pages: Map<string, IndexedPage>;
  backlinks: Map<string, Set<string>>;
  tags: Map<string, Set<string>>;
  properties: Map<string, Set<string>>;
  searchIndex: Map<string, string[]>;
  blockIds: Map<string, { pageName: string; blockIndex: number }>;
  tasks: Map<'TODO' | 'DOING' | 'DONE' | 'LATER' | 'NOW' | 'WAITING' | 'CANCELED', Set<string>>;
}

let graphIndex: GraphIndex = {
  pages: new Map(),
  backlinks: new Map(),
  tags: new Map(),
  properties: new Map(),
  searchIndex: new Map(),
  blockIds: new Map(),
  tasks: new Map(),
};

export async function buildIndex(filePaths: string[], rootPath: string): Promise<void> {
  const pages = new Map<string, IndexedPage>();
  const backlinks = new Map<string, Set<string>>();
  const tags = new Map<string, Set<string>>();
  const properties = new Map<string, Set<string>>();
  const searchIndex = new Map<string, string[]>();
  const blockIds = new Map<string, { pageName: string; blockIndex: number }>();
  const tasks = new Map<'TODO' | 'DOING' | 'DONE' | 'LATER' | 'NOW' | 'WAITING' | 'CANCELED', Set<string>>();

  for (const filePath of filePaths) {
    try {
      const content = await readMarkdownFile(filePath);
      const { frontmatter, body } = parseMarkdown(content);
      const blocks = parseLogseqContent(body);
      const allBlocks = getAllBlocks(blocks);

      const pageName = getPageName(filePath, rootPath);
      const allTags = new Set<string>();
      const allProperties: Record<string, string> = {};
      const taskCounts = {
        TODO: 0,
        DOING: 0,
        DONE: 0,
        LATER: 0,
        NOW: 0,
        WAITING: 0,
        CANCELED: 0,
      };

      for (let blockIndex = 0; blockIndex < allBlocks.length; blockIndex++) {
        const block = allBlocks[blockIndex];
        
        // Index block IDs
        if (block.id) {
          if (blockIds.has(block.id)) {
            console.warn(`[graph/index] Duplicate block ID found: ${block.id} in page ${pageName} (already exists in ${blockIds.get(block.id)?.pageName})`);
          } else {
            blockIds.set(block.id, { pageName, blockIndex });
          }
        }
        
        // Index task status
        if (block.taskStatus) {
          if (!tasks.has(block.taskStatus)) {
            tasks.set(block.taskStatus, new Set());
          }
          tasks.get(block.taskStatus)!.add(pageName);
          taskCounts[block.taskStatus]++;
        }
        
        block.tags.forEach((tag) => allTags.add(tag));
        Object.assign(allProperties, block.properties);
        
        block.references.forEach((ref) => {
          if (!backlinks.has(ref)) {
            backlinks.set(ref, new Set());
          }
          backlinks.get(ref)!.add(pageName);
        });
        
        block.tags.forEach((tag) => {
          if (!tags.has(tag)) {
            tags.set(tag, new Set());
          }
          tags.get(tag)!.add(pageName);
        });
        
        Object.keys(block.properties).forEach((prop) => {
          if (!properties.has(prop)) {
            properties.set(prop, new Set());
          }
          properties.get(prop)!.add(pageName);
        });
      }

      const words = extractWords(content);
      searchIndex.set(pageName, words);

      const stats = await import('fs/promises').then((fs) => fs.stat(filePath));

      pages.set(pageName, {
        path: filePath,
        name: pageName,
        frontmatter,
        blocks: allBlocks.map((b) => ({
          id: b.id,
          content: b.content,
          level: b.level,
          properties: b.properties,
          tags: b.tags,
          references: b.references,
          blockRefs: b.blockRefs,
          taskStatus: b.taskStatus,
        })),
        allTags: Array.from(allTags),
        allProperties,
        modificationDate: stats.mtime,
        taskCounts,
      });
    } catch (error) {
      console.error(`Error indexing ${filePath}:`, error);
    }
  }

  graphIndex = {
    pages,
    backlinks,
    tags,
    properties,
    searchIndex,
    blockIds,
    tasks,
  };
  
  const journalPages = Array.from(pages.keys()).filter(k => k.startsWith('journals/'));
  const totalTasks = Array.from(tasks.values()).reduce((sum, set) => sum + set.size, 0);
  console.log('[graph/index] Index complete:', pages.size, 'pages,', journalPages.length, 'journals,', blockIds.size, 'block IDs,', totalTasks, 'tasks');
}

function getPageName(filePath: string, rootPath: string): string {
  // Handle cases where paths might have trailing slashes or different separators
  const normalizedRoot = rootPath.replace(/\/$/, '').replace(/\\/g, '/');
  const normalizedFilePath = filePath.replace(/\\/g, '/');
  
  // Use path.relative for better cross-platform path handling
  const path = require('path');
  const relative = path.relative(normalizedRoot, normalizedFilePath).replace(/\\/g, '/');
  const name = relative.replace(/\.md$/, '');
  return name;
}

function extractWords(content: string): string[] {
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return [...new Set(words)];
}

export function getIndex(): GraphIndex {
  return graphIndex;
}

