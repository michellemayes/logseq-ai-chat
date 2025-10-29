import { describe, it, expect } from 'vitest';
import { parseMarkdown } from './scanner';

describe('Markdown Scanner', () => {
  it('should parse frontmatter and body', () => {
    const content = `---
title: Test Page
tags: [test, example]
---

# Main Content

This is the body content.`;

    const result = parseMarkdown(content);
    
    expect(result.frontmatter).toHaveProperty('title', 'Test Page');
    expect(result.frontmatter).toHaveProperty('tags');
    expect(result.body).toContain('# Main Content');
    expect(result.body).toContain('This is the body content');
  });

  it('should handle content without frontmatter', () => {
    const content = '# Simple Content\n\nNo frontmatter here.';
    const result = parseMarkdown(content);
    
    expect(result.body).toBe(content);
    expect(result.frontmatter).toEqual({});
  });

  it('should handle empty frontmatter', () => {
    const content = `---
---

Content here.`;
    const result = parseMarkdown(content);
    
    expect(result.frontmatter).toEqual({});
    expect(result.body.trim()).toBe('Content here.');
  });
});

