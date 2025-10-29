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

