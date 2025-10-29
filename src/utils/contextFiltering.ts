import { ContextSettings } from '../types';

export function getDefaultContextSettings(): ContextSettings {
  return {
    maxPages: 5,
    maxBlocksPerPage: 50,
    maxTotalBlocks: 100,
    searchResultLimit: 5,
    relevanceThreshold: 1,
    includeBlocks: 'all',
  };
}

export function scoreBlockRelevance(block: { content: string }, query: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const blockContent = block.content.toLowerCase();
  let score = 0;
  
  for (const word of queryWords) {
    if (blockContent.includes(word)) {
      const matches = (blockContent.match(new RegExp(word, 'g')) || []).length;
      score += matches;
    }
  }
  
  return score;
}

export function filterBlocks(
  blocks: Array<{ content: string; id?: string; level: number }>,
  query: string,
  mode: 'all' | 'matched' | 'top',
  maxBlocks: number
): Array<{ content: string; id?: string; level: number }> {
  if (mode === 'all') {
    return blocks.slice(0, maxBlocks);
  }
  
  if (mode === 'matched') {
    const matched = blocks.filter(b => {
      const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const blockContent = b.content.toLowerCase();
      return queryWords.some(word => blockContent.includes(word));
    });
    return matched.slice(0, maxBlocks);
  }
  
  if (mode === 'top') {
    const scored = blocks.map(b => ({ block: b, score: scoreBlockRelevance(b, query) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxBlocks).map(s => s.block);
  }
  
  return blocks.slice(0, maxBlocks);
}

export function shouldExcludePage(pageName: string, excludeNamespaces?: string[]): boolean {
  if (!excludeNamespaces || excludeNamespaces.length === 0) return false;
  
  for (const ns of excludeNamespaces) {
    if (pageName.startsWith(ns + '/') || pageName === ns) {
      return true;
    }
  }
  
  return false;
}

export function isJournalInRange(journalDate: string, dateRangeDays?: number): boolean {
  if (!dateRangeDays) return true;
  
  try {
    const datePart = journalDate.replace('journals/', '');
    const parts = datePart.split('_');
    if (parts.length !== 3) return true; // Invalid format, include it
    
    const [year, month, day] = parts.map(Number);
    
    // Validate date values
    if (isNaN(year) || isNaN(month) || isNaN(day)) return true;
    if (month < 1 || month > 12) return true;
    if (day < 1 || day > 31) return true;
    
    const journalDateObj = new Date(year, month - 1, day);
    
    // Check if date is valid (e.g., 2025_02_30 would be invalid)
    if (journalDateObj.getFullYear() !== year || 
        journalDateObj.getMonth() !== month - 1 || 
        journalDateObj.getDate() !== day) {
      return true; // Invalid date, include it
    }
    
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - journalDateObj.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= dateRangeDays && diffDays >= 0;
  } catch {
    return true; // If parsing fails, include it
  }
}

export function formatBlocksAsMarkdown(blocks: Array<{ content: string; level: number }>): string {
  return blocks
    .map(b => '  '.repeat(b.level) + '- ' + b.content)
    .join('\n')
    .substring(0, 500);
}

