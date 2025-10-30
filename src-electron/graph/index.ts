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
  }>;
  allTags: string[];
  allProperties: Record<string, string>;
  modificationDate: Date;
}

export interface GraphIndex {
  pages: Map<string, IndexedPage>;
  backlinks: Map<string, Set<string>>;
  tags: Map<string, Set<string>>;
  properties: Map<string, Set<string>>;
  searchIndex: Map<string, string[]>;
  blockIds: Map<string, { pageName: string; blockIndex: number }>;
}

let graphIndex: GraphIndex = {
  pages: new Map(),
  backlinks: new Map(),
  tags: new Map(),
  properties: new Map(),
  searchIndex: new Map(),
  blockIds: new Map(),
};

export async function buildIndex(filePaths: string[], rootPath: string): Promise<void> {
  const pages = new Map<string, IndexedPage>();
  const backlinks = new Map<string, Set<string>>();
  const tags = new Map<string, Set<string>>();
  const properties = new Map<string, Set<string>>();
  const searchIndex = new Map<string, string[]>();
  const blockIds = new Map<string, { pageName: string; blockIndex: number }>();

  for (const filePath of filePaths) {
    try {
      const content = await readMarkdownFile(filePath);
      const { frontmatter, body } = parseMarkdown(content);
      const blocks = parseLogseqContent(body);
      const allBlocks = getAllBlocks(blocks);

      const pageName = getPageName(filePath, rootPath);
      const allTags = new Set<string>();
      const allProperties: Record<string, string> = {};

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
        })),
        allTags: Array.from(allTags),
        allProperties,
        modificationDate: stats.mtime,
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
  };
  
  const journalPages = Array.from(pages.keys()).filter(k => k.startsWith('journals/'));
  console.log('[graph/index] Index complete:', pages.size, 'pages,', journalPages.length, 'journals,', blockIds.size, 'block IDs');
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

