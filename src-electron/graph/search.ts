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

// ========== Temporal Intelligence Functions ==========

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

/**
 * Parse natural language date queries into date ranges
 */
export function parseDateRange(query: string, referenceDate?: Date): JournalDateRange | null {
  const today = referenceDate || new Date();
  const queryLower = query.toLowerCase().trim();
  
  // Relative date patterns
  if (queryLower.includes('last week') || queryLower.includes('past week')) {
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7);
    return { startDate, endDate };
  }
  
  if (queryLower.includes('last month') || queryLower.includes('past month')) {
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 1);
    return { startDate, endDate };
  }
  
  // Parse "last N days" pattern
  const lastNDaysMatch = queryLower.match(/last\s+(\d+)\s+days?/);
  if (lastNDaysMatch) {
    const days = parseInt(lastNDaysMatch[1], 10);
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    return { startDate, endDate };
  }
  
  // Parse "last N weeks" pattern
  const lastNWeeksMatch = queryLower.match(/last\s+(\d+)\s+weeks?/);
  if (lastNWeeksMatch) {
    const weeks = parseInt(lastNWeeksMatch[1], 10);
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7));
    return { startDate, endDate };
  }
  
  // Parse "last N months" pattern
  const lastNMonthsMatch = queryLower.match(/last\s+(\d+)\s+months?/);
  if (lastNMonthsMatch) {
    const months = parseInt(lastNMonthsMatch[1], 10);
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);
    return { startDate, endDate };
  }
  
  // Parse absolute date range: "from YYYY-MM-DD to YYYY-MM-DD" or "YYYY-MM-DD to YYYY-MM-DD"
  const dateRangePattern = /(\d{4}-\d{2}-\d{2})\s+(?:to|through|-)\s+(\d{4}-\d{2}-\d{2})/;
  const dateRangeMatch = queryLower.match(dateRangePattern);
  if (dateRangeMatch) {
    const startDate = new Date(dateRangeMatch[1]);
    const endDate = new Date(dateRangeMatch[2]);
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      return { startDate, endDate };
    }
  }
  
  // Parse single date: "YYYY-MM-DD"
  const singleDatePattern = /(\d{4}-\d{2}-\d{2})/;
  const singleDateMatch = queryLower.match(singleDatePattern);
  if (singleDateMatch) {
    const date = new Date(singleDateMatch[1]);
    if (!isNaN(date.getTime())) {
      return { startDate: date, endDate: date };
    }
  }
  
  return null;
}

/**
 * Convert journal page name to Date
 */
function journalPageNameToDate(pageName: string): Date | null {
  if (!pageName.startsWith('journals/')) {
    return null;
  }
  
  const dateStr = pageName.replace('journals/', '');
  const parts = dateStr.split('_');
  if (parts.length !== 3) {
    return null;
  }
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const day = parseInt(parts[2], 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return null;
  }
  
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null; // Invalid date
  }
  
  return date;
}

/**
 * Query journals by date range
 */
export function queryJournalsByDateRange(startDate: Date, endDate: Date): JournalWithDate[] {
  const index = getIndex();
  const results: JournalWithDate[] = [];
  
  // Normalize dates (set to start/end of day)
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  // Iterate through all pages and filter journals within date range
  for (const [pageName, page] of index.pages.entries()) {
    if (!pageName.startsWith('journals/')) {
      continue;
    }
    
    const journalDate = journalPageNameToDate(pageName);
    if (!journalDate) {
      continue;
    }
    
    if (journalDate >= start && journalDate <= end) {
      const dateStr = `${journalDate.getFullYear()}-${String(journalDate.getMonth() + 1).padStart(2, '0')}-${String(journalDate.getDate()).padStart(2, '0')}`;
      results.push({
        ...page,
        pageName: page.name,
        path: page.path,
        frontmatter: page.frontmatter,
        blocks: page.blocks,
        allTags: page.allTags,
        allProperties: page.allProperties,
        date: journalDate,
        dateStr,
      });
    }
  }
  
  // Sort by date (newest first)
  return results.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Query journals from last week
 */
export function queryJournalsLastWeek(): JournalWithDate[] {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7);
  return queryJournalsByDateRange(startDate, today);
}

/**
 * Query journals from last month
 */
export function queryJournalsLastMonth(): JournalWithDate[] {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 1);
  return queryJournalsByDateRange(startDate, today);
}

/**
 * Query journals from last N days
 */
export function queryJournalsLastNDays(days: number): JournalWithDate[] {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);
  return queryJournalsByDateRange(startDate, today);
}

/**
 * Compare two journal entries
 */
export function compareJournals(date1: string, date2: string): JournalComparison | null {
  const journal1 = getJournal(date1);
  const journal2 = getJournal(date2);
  
  if (!journal1 || !journal2) {
    return null;
  }
  
  // Extract keywords from content
  const extractKeywords = (blocks: Array<{ content: string }>): string[] => {
    const words = new Set<string>();
    for (const block of blocks) {
      const blockWords = block.content
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3);
      blockWords.forEach(w => words.add(w));
    }
    return Array.from(words);
  };
  
  const keywords1 = extractKeywords(journal1.blocks);
  const keywords2 = extractKeywords(journal2.blocks);
  
  // Calculate content similarity (shared keywords)
  const sharedKeywords = keywords1.filter(k => keywords2.includes(k));
  const totalKeywords = new Set([...keywords1, ...keywords2]).size;
  const contentSimilarity = totalKeywords > 0 ? sharedKeywords.length / totalKeywords : 0;
  
  // Compare tags
  const sharedTags = journal1.allTags.filter(t => journal2.allTags.includes(t));
  const uniqueTags1 = journal1.allTags.filter(t => !journal2.allTags.includes(t));
  const uniqueTags2 = journal2.allTags.filter(t => !journal1.allTags.includes(t));
  
  return {
    date1,
    date2,
    contentSimilarity: Math.round(contentSimilarity * 100) / 100,
    sharedTags,
    uniqueTags1,
    uniqueTags2,
    blockCount1: journal1.blocks.length,
    blockCount2: journal2.blocks.length,
    sharedKeywords: Array.from(sharedKeywords).slice(0, 20), // Limit to top 20
  };
}

/**
 * Detect recurring patterns in journals
 */
export function detectRecurringTags(journalDates: Date[]): JournalPattern[] {
  const tagFrequency = new Map<string, number>();
  const tagExamples = new Map<string, string[]>();
  
  for (const date of journalDates) {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const journal = getJournal(dateStr);
    if (!journal) continue;
    
    for (const tag of journal.allTags) {
      tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      if (!tagExamples.has(tag)) {
        tagExamples.set(tag, []);
      }
      if (tagExamples.get(tag)!.length < 3) {
        tagExamples.get(tag)!.push(dateStr);
      }
    }
  }
  
  const patterns: JournalPattern[] = [];
  const threshold = Math.max(2, Math.ceil(journalDates.length * 0.3)); // At least 30% frequency
  
  for (const [tag, frequency] of tagFrequency.entries()) {
    if (frequency >= threshold) {
      patterns.push({
        type: 'tag',
        pattern: tag,
        frequency,
        examples: tagExamples.get(tag) || [],
        description: `Tag "${tag}" appears in ${frequency} of ${journalDates.length} journals`,
      });
    }
  }
  
  return patterns.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Detect recurring topics/keywords in journals
 */
export function detectRecurringTopics(journalDates: Date[]): JournalPattern[] {
  const keywordFrequency = new Map<string, number>();
  const keywordExamples = new Map<string, string[]>();
  
  // Extract keywords from journal content
  for (const date of journalDates) {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const journal = getJournal(dateStr);
    if (!journal) continue;
    
    const words = new Set<string>();
    for (const block of journal.blocks) {
      const blockWords = block.content
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4); // Focus on longer words (topics)
      blockWords.forEach(w => words.add(w));
    }
    
    for (const word of words) {
      keywordFrequency.set(word, (keywordFrequency.get(word) || 0) + 1);
      if (!keywordExamples.has(word)) {
        keywordExamples.set(word, []);
      }
      if (keywordExamples.get(word)!.length < 3) {
        keywordExamples.get(word)!.push(dateStr);
      }
    }
  }
  
  const patterns: JournalPattern[] = [];
  const threshold = Math.max(2, Math.ceil(journalDates.length * 0.3)); // At least 30% frequency
  
  for (const [keyword, frequency] of keywordFrequency.entries()) {
    if (frequency >= threshold) {
      patterns.push({
        type: 'topic',
        pattern: keyword,
        frequency,
        examples: keywordExamples.get(keyword) || [],
        description: `Topic "${keyword}" appears in ${frequency} of ${journalDates.length} journals`,
      });
    }
  }
  
  return patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 20); // Limit to top 20
}

/**
 * Detect recurring content patterns
 */
export function detectRecurringContent(journalDates: Date[]): JournalPattern[] {
  const contentPatterns = new Map<string, { frequency: number; examples: string[] }>();
  
  // Look for similar block beginnings (common patterns like "Daily standup", "Meeting notes", etc.)
  for (const date of journalDates) {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const journal = getJournal(dateStr);
    if (!journal) continue;
    
    for (const block of journal.blocks) {
      // Extract first few words as a pattern
      const firstWords = block.content
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .join(' ')
        .toLowerCase();
      
      if (firstWords.length > 5) {
        if (!contentPatterns.has(firstWords)) {
          contentPatterns.set(firstWords, { frequency: 0, examples: [] });
        }
        const pattern = contentPatterns.get(firstWords)!;
        pattern.frequency++;
        if (pattern.examples.length < 3) {
          pattern.examples.push(dateStr);
        }
      }
    }
  }
  
  const patterns: JournalPattern[] = [];
  const threshold = Math.max(2, Math.ceil(journalDates.length * 0.2)); // At least 20% frequency
  
  for (const [content, data] of contentPatterns.entries()) {
    if (data.frequency >= threshold) {
      patterns.push({
        type: 'content',
        pattern: content,
        frequency: data.frequency,
        examples: data.examples,
        description: `Content pattern "${content}" appears ${data.frequency} times across journals`,
      });
    }
  }
  
  return patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 10); // Limit to top 10
}

/**
 * Detect temporal patterns (e.g., journals on specific weekdays)
 */
export function detectTemporalPatterns(journalDates: Date[]): JournalPattern[] {
  const weekdayFrequency = new Map<string, number>();
  const weekdayExamples = new Map<string, string[]>();
  
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (const date of journalDates) {
    const weekday = weekdayNames[date.getDay()];
    weekdayFrequency.set(weekday, (weekdayFrequency.get(weekday) || 0) + 1);
    if (!weekdayExamples.has(weekday)) {
      weekdayExamples.set(weekday, []);
    }
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (weekdayExamples.get(weekday)!.length < 3) {
      weekdayExamples.get(weekday)!.push(dateStr);
    }
  }
  
  const patterns: JournalPattern[] = [];
  
  for (const [weekday, frequency] of weekdayFrequency.entries()) {
    if (frequency >= 2) {
      patterns.push({
        type: 'temporal',
        pattern: weekday,
        frequency,
        examples: weekdayExamples.get(weekday) || [],
        description: `Journals often written on ${weekday} (${frequency} occurrences)`,
      });
    }
  }
  
  return patterns.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Detect all patterns in journals
 */
export function detectJournalPatterns(journalDates: Date[]): JournalPattern[] {
  const allPatterns: JournalPattern[] = [
    ...detectRecurringTags(journalDates),
    ...detectRecurringTopics(journalDates),
    ...detectRecurringContent(journalDates),
    ...detectTemporalPatterns(journalDates),
  ];
  
  return allPatterns;
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

// ========== Task Query Functions ==========

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

export interface TaskQueryOptions {
  pageName?: string;
  dateRange?: { start: Date; end: Date };
}

export function queryTasksByStatus(
  status: 'TODO' | 'DOING' | 'DONE' | 'LATER' | 'NOW' | 'WAITING' | 'CANCELED',
  options?: TaskQueryOptions
): TaskBlock[] {
  const index = getIndex();
  const tasks: TaskBlock[] = [];
  const pageNames = options?.pageName 
    ? new Set([options.pageName])
    : index.tasks.get(status) || new Set();

  for (const pageName of pageNames) {
    const page = index.pages.get(pageName);
    if (!page) continue;

    // Filter by date range if specified
    if (options?.dateRange) {
      const isJournal = pageName.startsWith('journals/');
      if (isJournal) {
        const dateStr = pageName.replace('journals/', '').replace(/_/g, '-');
        const journalDate = new Date(dateStr);
        if (journalDate < options.dateRange.start || journalDate > options.dateRange.end) {
          continue;
        }
      }
    }

    for (const block of page.blocks) {
      if (block.taskStatus === status) {
        tasks.push({
          id: block.id,
          content: block.content,
          level: block.level,
          properties: block.properties,
          tags: block.tags,
          references: block.references,
          blockRefs: block.blockRefs,
          taskStatus: block.taskStatus,
          pageName,
        });
      }
    }
  }

  return tasks;
}

export function queryTasksByPage(pageName: string): TaskBlock[] {
  const index = getIndex();
  const page = index.pages.get(pageName);
  if (!page) return [];

  const tasks: TaskBlock[] = [];
  for (const block of page.blocks) {
    if (block.taskStatus) {
      tasks.push({
        id: block.id,
        content: block.content,
        level: block.level,
        properties: block.properties,
        tags: block.tags,
        references: block.references,
        blockRefs: block.blockRefs,
        taskStatus: block.taskStatus,
        pageName,
      });
    }
  }

  return tasks;
}

export function queryTasksByDateRange(start: Date, end: Date): TaskBlock[] {
  const index = getIndex();
  const tasks: TaskBlock[] = [];

  for (const [pageName, page] of index.pages.entries()) {
    if (!pageName.startsWith('journals/')) continue;

    const dateStr = pageName.replace('journals/', '').replace(/_/g, '-');
    const journalDate = new Date(dateStr);
    if (journalDate < start || journalDate > end) continue;

    for (const block of page.blocks) {
      if (block.taskStatus) {
        tasks.push({
          id: block.id,
          content: block.content,
          level: block.level,
          properties: block.properties,
          tags: block.tags,
          references: block.references,
          blockRefs: block.blockRefs,
          taskStatus: block.taskStatus,
          pageName,
        });
      }
    }
  }

  return tasks;
}

export function queryTasksDueThisWeek(): TaskBlock[] {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);

  return queryTasksDueBetween(startOfWeek, endOfWeek);
}

export function queryTasksDueBetween(start: Date, end: Date): TaskBlock[] {
  const index = getIndex();
  const tasks: TaskBlock[] = [];

  for (const [pageName, page] of index.pages.entries()) {
    for (const block of page.blocks) {
      if (!block.taskStatus) continue;

      // Check scheduled/deadline properties
      const scheduled = block.properties.scheduled || block.properties.deadline;
      if (scheduled) {
        try {
          const taskDate = new Date(scheduled);
          if (taskDate >= start && taskDate <= end) {
            tasks.push({
              id: block.id,
              content: block.content,
              level: block.level,
              properties: block.properties,
              tags: block.tags,
              references: block.references,
              blockRefs: block.blockRefs,
              taskStatus: block.taskStatus,
              pageName,
            });
          }
        } catch {
          // Invalid date format, skip
        }
      }
    }
  }

  return tasks;
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

export function getTaskSummary(journalDate: Date): TaskSummary | null {
  const dateStr = journalDate.toISOString().split('T')[0].replace(/-/g, '_');
  const journalPageName = `journals/${dateStr}`;
  const tasks = queryTasksByPage(journalPageName);

  if (tasks.length === 0) {
    return null;
  }

  const byStatus = {
    TODO: 0,
    DOING: 0,
    DONE: 0,
    LATER: 0,
    NOW: 0,
    WAITING: 0,
    CANCELED: 0,
  };

  for (const task of tasks) {
    byStatus[task.taskStatus]++;
  }

  return {
    date: dateStr,
    totalTasks: tasks.length,
    byStatus,
    tasks,
  };
}

