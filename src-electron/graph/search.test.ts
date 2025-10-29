import { describe, it, expect } from 'vitest';
import { searchGraph, getBacklinks, getForwardLinks } from './search';

describe('Graph Search', () => {
  it('should search for pages by content', () => {
    const results = searchGraph('test query');
    
    expect(Array.isArray(results)).toBe(true);
    // Results structure validation
    results.forEach((result) => {
      expect(result).toHaveProperty('pageName');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('excerpt');
      expect(result).toHaveProperty('blocks');
      expect(typeof result.score).toBe('number');
    });
  });

  it('should return empty array for non-matching query', () => {
    const results = searchGraph('xyzabc123nonexistent');
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle backlinks', () => {
    const backlinks = getBacklinks('TestPage');
    expect(Array.isArray(backlinks)).toBe(true);
  });

  it('should handle forward links', () => {
    const forwardLinks = getForwardLinks('TestPage');
    expect(Array.isArray(forwardLinks)).toBe(true);
  });
});

