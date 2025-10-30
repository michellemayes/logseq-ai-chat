import { getIndex } from './index';

export interface SearchResult {
  pageName: string;
  score: number;
  excerpt: string;
  blocks: Array<{ content: string; id?: string }>;
}

export function searchGraph(query: string, options?: { relevanceThreshold?: number; searchResultLimit?: number }): SearchResult[] {
  const index = getIndex();
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const results: SearchResult[] = [];
  const threshold = options?.relevanceThreshold ?? 0;
  const limit = options?.searchResultLimit ?? 10;

  for (const [pageName, page] of index.pages.entries()) {
    let score = 0;
    const matchedBlocks: Array<{ content: string; id?: string }> = [];

    for (const word of queryWords) {
      const pageWords = index.searchIndex.get(pageName) || [];
      if (pageWords.includes(word)) {
        score += 1;
      }

      for (const block of page.blocks) {
        if (block.content.toLowerCase().includes(word)) {
          score += 2;
          matchedBlocks.push({
            content: block.content.substring(0, 200),
            id: block.id,
          });
        }
      }

      if (pageName.toLowerCase().includes(word)) {
        score += 3;
      }

      if (page.allTags.some((tag) => tag.toLowerCase().includes(word))) {
        score += 1;
      }
    }

    if (score > threshold) {
      results.push({
        pageName,
        score,
        excerpt: page.blocks[0]?.content.substring(0, 200) || '',
        blocks: matchedBlocks.slice(0, 5),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function scoreBlockRelevance(block: { content: string }, query: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const blockContent = block.content.toLowerCase();
  let score = 0;
  
  for (const word of queryWords) {
    if (blockContent.includes(word)) {
      // Count occurrences for higher score
      const matches = (blockContent.match(new RegExp(word, 'g')) || []).length;
      score += matches;
    }
  }
  
  return score;
}

export function getBacklinks(pageName: string): string[] {
  const index = getIndex();
  const links = index.backlinks.get(pageName);
  return links ? Array.from(links) : [];
}

export function getForwardLinks(pageName: string): string[] {
  const index = getIndex();
  const page = index.pages.get(pageName);
  if (!page) return [];

  const links = new Set<string>();
  for (const block of page.blocks) {
    block.references.forEach((ref) => links.add(ref));
  }
  return Array.from(links);
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

/**
 * Get all pages connected to a given page (combines backlinks and forward links)
 */
export function getConnectedPages(pageName: string): string[] {
  const backlinks = getBacklinks(pageName);
  const forwardLinks = getForwardLinks(pageName);
  const connected = new Set<string>();
  
  backlinks.forEach(link => connected.add(link));
  forwardLinks.forEach(link => connected.add(link));
  
  return Array.from(connected);
}

/**
 * Traverse the graph starting from a page, returning pages at each hop level
 */
export function traverseGraph(pageName: string, maxHops: number = 3): TraversalResult[] {
  const index = getIndex();
  const visited = new Set<string>();
  const results: TraversalResult[] = [];
  const queue: Array<{ pageName: string; hopLevel: number }> = [];
  
  // Start with the initial page
  if (index.pages.has(pageName)) {
    visited.add(pageName);
    queue.push({ pageName, hopLevel: 0 });
  }
  
  // Breadth-first search
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current.hopLevel > 0) {
      results.push({
        pageName: current.pageName,
        hopLevel: current.hopLevel,
      });
    }
    
    if (current.hopLevel >= maxHops) {
      continue;
    }
    
    // Get connected pages (backlinks and forward links)
    const connected = getConnectedPages(current.pageName);
    
    for (const connectedPage of connected) {
      if (!visited.has(connectedPage)) {
        visited.add(connectedPage);
        queue.push({ pageName: connectedPage, hopLevel: current.hopLevel + 1 });
      }
    }
  }
  
  return results;
}

/**
 * Find pages related to a given page through shared connections, tags, or properties
 */
export function findRelatedPages(
  pageName: string,
  options?: { maxHops?: number; minConnections?: number }
): RelatedPageResult[] {
  const index = getIndex();
  const maxHops = options?.maxHops ?? 2;
  const minConnections = options?.minConnections ?? 1;
  
  const page = index.pages.get(pageName);
  if (!page) {
    return [];
  }
  
  // Get pages connected through traversal
  const traversalResults = traverseGraph(pageName, maxHops);
  const candidatePages = new Set<string>();
  
  traversalResults.forEach(result => {
    if (result.hopLevel > 0) {
      candidatePages.add(result.pageName);
    }
  });
  
  // Score pages by connection strength
  const relatedPages = new Map<string, { strength: number; types: Set<string> }>();
  
  for (const candidatePage of candidatePages) {
    const candidate = index.pages.get(candidatePage);
    if (!candidate) continue;
    
    let strength = 0;
    const types = new Set<string>();
    
    // Shared connections (pages that link to/from the same pages)
    const pageConnections = getConnectedPages(pageName);
    const candidateConnections = getConnectedPages(candidatePage);
    const sharedConnections = pageConnections.filter(c => candidateConnections.includes(c));
    
    if (sharedConnections.length > 0) {
      strength += sharedConnections.length;
      types.add('shared-connections');
    }
    
    // Shared tags
    const sharedTags = page.allTags.filter(tag => candidate.allTags.includes(tag));
    if (sharedTags.length > 0) {
      strength += sharedTags.length * 2; // Tags are weighted higher
      types.add('shared-tags');
    }
    
    // Shared properties
    const sharedProperties = Object.keys(page.allProperties).filter(
      prop => candidate.allProperties[prop] && 
      page.allProperties[prop] === candidate.allProperties[prop]
    );
    if (sharedProperties.length > 0) {
      strength += sharedProperties.length;
      types.add('shared-properties');
    }
    
    if (strength >= minConnections) {
      relatedPages.set(candidatePage, {
        strength,
        types,
      });
    }
  }
  
  // Convert to array and sort by strength
  return Array.from(relatedPages.entries())
    .map(([pageName, data]) => ({
      pageName,
      connectionStrength: data.strength,
      connectionTypes: Array.from(data.types),
    }))
    .sort((a, b) => b.connectionStrength - a.connectionStrength);
}

/**
 * Find pages with no backlinks and no forward links (orphaned pages)
 */
export function findOrphanedPages(options?: { includeTagged?: boolean }): OrphanedPage[] {
  const index = getIndex();
  const includeTagged = options?.includeTagged ?? false;
  const orphaned: OrphanedPage[] = [];
  
  for (const [pageName, page] of index.pages.entries()) {
    // Skip journals
    if (pageName.startsWith('journals/')) {
      continue;
    }
    
    const backlinks = getBacklinks(pageName);
    const forwardLinks = getForwardLinks(pageName);
    
    // Check if page is orphaned (no connections)
    if (backlinks.length === 0 && forwardLinks.length === 0) {
      // If includeTagged is false, exclude pages with tags (considered "connected" via tags)
      if (includeTagged || page.allTags.length === 0) {
        orphaned.push({
          pageName,
          path: page.path,
          hasTags: page.allTags.length > 0,
        });
      }
    }
  }
  
  return orphaned;
}

export function getPage(pageName: string): PageContent | null {
  const index = getIndex();
  
  // Try exact match first
  let page = index.pages.get(pageName);
  
  // If not found, try lowercase match
  if (!page) {
    for (const [key, value] of index.pages.entries()) {
      if (key.toLowerCase() === pageName.toLowerCase()) {
        page = value;
        break;
      }
    }
  }
  
  if (!page) {
    return null;
  }

  return {
    pageName: page.name,
    path: page.path,
    frontmatter: page.frontmatter,
    blocks: page.blocks,
    allTags: page.allTags,
    allProperties: page.allProperties,
  };
}

export function getJournal(dateStr: string): PageContent | null {
  // Convert date from YYYY-MM-DD to YYYY_MM_DD format (Logseq journal format)
  const journalPageName = `journals/${dateStr.replace(/-/g, '_')}`;
  return getPage(journalPageName);
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

export function getBlockById(blockId: string): BlockWithPage | null {
  const index = getIndex();
  
  // Look up block in index
  const blockInfo = index.blockIds.get(blockId);
  if (!blockInfo) {
    return null;
  }
  
  // Get the parent page
  const page = index.pages.get(blockInfo.pageName);
  if (!page) {
    return null;
  }
  
  // Get the block itself
  const block = page.blocks[blockInfo.blockIndex];
  if (!block) {
    return null;
  }
  
  // Get sibling blocks (same level or parent level for context)
  const siblingBlocks: Array<{
    id?: string;
    content: string;
    level: number;
    properties: Record<string, string>;
    tags: string[];
    references: string[];
    blockRefs: string[];
  }> = [];
  
  // Include blocks before and after (up to 2 each) for context
  const startIndex = Math.max(0, blockInfo.blockIndex - 2);
  const endIndex = Math.min(page.blocks.length, blockInfo.blockIndex + 3);
  
  for (let i = startIndex; i < endIndex; i++) {
    if (i !== blockInfo.blockIndex) {
      siblingBlocks.push(page.blocks[i]);
    }
  }
  
  return {
    block,
    pageName: blockInfo.pageName,
    blockIndex: blockInfo.blockIndex,
    parentPage: {
      pageName: page.name,
      path: page.path,
      frontmatter: page.frontmatter,
      blocks: page.blocks,
      allTags: page.allTags,
      allProperties: page.allProperties,
    },
    siblingBlocks: siblingBlocks.length > 0 ? siblingBlocks : undefined,
  };
}

