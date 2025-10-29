import { describe, it, expect } from 'vitest';
import { 
  scoreBlockRelevance, 
  filterBlocks, 
  shouldExcludePage, 
  isJournalInRange,
  getDefaultContextSettings
} from './contextFiltering';

describe('Context Filtering Utilities', () => {
  describe('scoreBlockRelevance', () => {
    it('should score blocks based on keyword matches', () => {
      const block = { content: 'This is a test block about programming' };
      const query = 'test programming';
      
      const score = scoreBlockRelevance(block, query);
      expect(score).toBeGreaterThan(0);
    });

    it('should return 0 for non-matching blocks', () => {
      const block = { content: 'This is about something else' };
      const query = 'test programming';
      
      const score = scoreBlockRelevance(block, query);
      expect(score).toBe(0);
    });

    it('should count multiple occurrences of keywords', () => {
      const block = { content: 'test test test programming' };
      const query = 'test programming';
      
      const score = scoreBlockRelevance(block, query);
      expect(score).toBeGreaterThan(2); // At least 3 matches for 'test'
    });

    it('should ignore short words (2 chars or less)', () => {
      const block = { content: 'This is a test' };
      const query = 'is a test';
      
      const score = scoreBlockRelevance(block, query);
      expect(score).toBeGreaterThan(0); // Should match 'test', not 'is' or 'a'
    });
  });

  describe('filterBlocks', () => {
    const sampleBlocks = [
      { content: 'First block about programming', id: '1', level: 0 },
      { content: 'Second block about testing', id: '2', level: 0 },
      { content: 'Third block about something else', id: '3', level: 0 },
      { content: 'Fourth block about programming', id: '4', level: 0 },
    ];

    it('should return all blocks when mode is "all"', () => {
      const result = filterBlocks(sampleBlocks, 'programming', 'all', 10);
      expect(result.length).toBe(sampleBlocks.length);
    });

    it('should respect maxBlocks limit in "all" mode', () => {
      const result = filterBlocks(sampleBlocks, 'programming', 'all', 2);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should filter to only matching blocks in "matched" mode', () => {
      const result = filterBlocks(sampleBlocks, 'programming', 'matched', 10);
      expect(result.length).toBe(2);
      expect(result.every(b => b.content.includes('programming'))).toBe(true);
    });

    it('should respect maxBlocks limit in "matched" mode', () => {
      const result = filterBlocks(sampleBlocks, 'programming', 'matched', 1);
      expect(result.length).toBe(1);
      expect(result[0].content).toContain('programming');
    });

    it('should return top scoring blocks in "top" mode', () => {
      const blocks = [
        { content: 'programming programming programming', id: '1', level: 0 },
        { content: 'programming programming', id: '2', level: 0 },
        { content: 'programming', id: '3', level: 0 },
        { content: 'something else', id: '4', level: 0 },
      ];
      
      const result = filterBlocks(blocks, 'programming', 'top', 2);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('1'); // Highest score
      expect(result[1].id).toBe('2'); // Second highest
    });

    it('should return empty array when no blocks match in "matched" mode', () => {
      const result = filterBlocks(sampleBlocks, 'nonexistent', 'matched', 10);
      expect(result.length).toBe(0);
    });
  });

  describe('shouldExcludePage', () => {
    it('should return false when no exclude namespaces provided', () => {
      expect(shouldExcludePage('TestPage', undefined)).toBe(false);
      expect(shouldExcludePage('TestPage', [])).toBe(false);
    });

    it('should exclude pages in specified namespaces', () => {
      expect(shouldExcludePage('archive/OldPage', ['archive'])).toBe(true);
      expect(shouldExcludePage('archive', ['archive'])).toBe(true);
      expect(shouldExcludePage('pages/RegularPage', ['archive'])).toBe(false);
    });

    it('should handle multiple namespaces', () => {
      const excludeNamespaces = ['archive', 'templates'];
      expect(shouldExcludePage('archive/OldPage', excludeNamespaces)).toBe(true);
      expect(shouldExcludePage('templates/MyTemplate', excludeNamespaces)).toBe(true);
      expect(shouldExcludePage('pages/RegularPage', excludeNamespaces)).toBe(false);
    });

    it('should handle namespace prefixes correctly', () => {
      expect(shouldExcludePage('archive/page', ['archive'])).toBe(true);
      expect(shouldExcludePage('archived/page', ['archive'])).toBe(false);
    });
  });

  describe('isJournalInRange', () => {
    it('should return true when no date range specified', () => {
      expect(isJournalInRange('journals/2025_10_29', undefined)).toBe(true);
    });

    it('should include journals within date range', () => {
      // Create a journal from 5 days ago
      const today = new Date();
      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(today.getDate() - 5);
      const dateStr = `${fiveDaysAgo.getFullYear()}_${String(fiveDaysAgo.getMonth() + 1).padStart(2, '0')}_${String(fiveDaysAgo.getDate()).padStart(2, '0')}`;
      
      expect(isJournalInRange(`journals/${dateStr}`, 30)).toBe(true);
      expect(isJournalInRange(`journals/${dateStr}`, 7)).toBe(true);
      expect(isJournalInRange(`journals/${dateStr}`, 3)).toBe(false);
    });

    it('should include today\'s journal', () => {
      const today = new Date();
      const dateStr = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`;
      
      expect(isJournalInRange(`journals/${dateStr}`, 30)).toBe(true);
      expect(isJournalInRange(`journals/${dateStr}`, 1)).toBe(true);
    });

    it('should exclude future journals', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      const dateStr = `${future.getFullYear()}_${String(future.getMonth() + 1).padStart(2, '0')}_${String(future.getDate()).padStart(2, '0')}`;
      
      expect(isJournalInRange(`journals/${dateStr}`, 30)).toBe(false);
    });

    it('should return true if date parsing fails', () => {
      expect(isJournalInRange('journals/invalid_date', 30)).toBe(true);
      expect(isJournalInRange('journals/2025_13_32', 30)).toBe(true); // Invalid date
    });
  });

  describe('getDefaultContextSettings', () => {
    it('should return default context settings', () => {
      const defaults = getDefaultContextSettings();
      
      expect(defaults.maxPages).toBe(5);
      expect(defaults.maxBlocksPerPage).toBe(50);
      expect(defaults.maxTotalBlocks).toBe(100);
      expect(defaults.searchResultLimit).toBe(5);
      expect(defaults.relevanceThreshold).toBe(1);
      expect(defaults.includeBlocks).toBe('all');
    });
  });
});

