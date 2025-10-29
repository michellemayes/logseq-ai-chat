import { getIndex } from './index';

export interface SearchResult {
  pageName: string;
  score: number;
  excerpt: string;
  blocks: Array<{ content: string; id?: string }>;
}

export function searchGraph(query: string): SearchResult[] {
  const index = getIndex();
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const results: SearchResult[] = [];

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

    if (score > 0) {
      results.push({
        pageName,
        score,
        excerpt: page.blocks[0]?.content.substring(0, 200) || '',
        blocks: matchedBlocks.slice(0, 5),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
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

export function getPage(pageName: string): PageContent | null {
  const index = getIndex();
  console.log('[graph/search] getPage called for:', pageName);
  console.log('[graph/search] Available pages count:', index.pages.size);
  console.log('[graph/search] Checking for page:', pageName);
  
  // Try exact match first
  let page = index.pages.get(pageName);
  
  // If not found, try lowercase match
  if (!page) {
    for (const [key, value] of index.pages.entries()) {
      if (key.toLowerCase() === pageName.toLowerCase()) {
        console.log('[graph/search] Found case-insensitive match:', key);
        page = value;
        break;
      }
    }
  }
  
  // List some journal pages for debugging
  if (pageName.startsWith('journals/')) {
    const journalPages = Array.from(index.pages.keys()).filter(k => k.startsWith('journals/'));
    console.log('[graph/search] Available journal pages:', journalPages);
  }
  
  if (!page) {
    console.log('[graph/search] Page NOT found:', pageName);
    return null;
  }

  console.log('[graph/search] Page found:', page.name, 'Blocks:', page.blocks.length);
  console.log('[graph/search] Page blocks:', page.blocks.map(b => ({ id: b.id, content: b.content.substring(0, 100) })));

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
  // Convert date from YYYY-MM-DD to YYYY_MM_DD format (LogSeq journal format)
  const journalPageName = `journals/${dateStr.replace(/-/g, '_')}`;
  console.log('[graph/search] getJournal called for date:', dateStr, '-> journal name:', journalPageName);
  return getPage(journalPageName);
}

