interface Block {
  id?: string;
  content: string;
  level: number;
  children: Block[];
  properties: Record<string, string>;
  tags: string[];
  references: string[];
  blockRefs: string[];
}

export function parseLogSeqContent(content: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  const stack: Block[] = [];

  function parseLine(line: string): { level: number; content: string; isBullet: boolean } {
    // Match bullet with content: "- content" or "* content" or "1. content"
    const matchWithContent = line.match(/^(\s*)(?:[-*+]|\d+\.)\s+(.+)$/);
    if (matchWithContent) {
      const indent = matchWithContent[1].length;
      const level = Math.floor(indent / 2);
      const content = matchWithContent[2];
      return { level, content, isBullet: true };
    }
    
    // Match bullet without content: "-" or "*" or "+" (just the marker, possibly with trailing space)
    const matchEmptyBullet = line.match(/^(\s*)([-*+]|\d+\.)\s*$/);
    if (matchEmptyBullet) {
      const indent = matchEmptyBullet[1].length;
      const level = Math.floor(indent / 2);
      return { level, content: '', isBullet: true };
    }
    
    // Not a bullet line
    return { level: 0, content: line, isBullet: false };
  }

  function extractBlockId(content: string): { id?: string; cleaned: string } {
    const match = content.match(/^(\w{13})\s+(.+)$/);
    if (match) {
      return { id: match[1], cleaned: match[2] };
    }
    return { cleaned: content };
  }

  function extractProperties(content: string): { properties: Record<string, string>; cleaned: string } {
    const properties: Record<string, string> = {};
    const lines = content.split('\n');
    const cleanedLines: string[] = [];
    
    for (const line of lines) {
      const propMatch = line.match(/^(\w+)::\s*(.+)$/);
      if (propMatch) {
        properties[propMatch[1]] = propMatch[2];
      } else {
        cleanedLines.push(line);
      }
    }
    
    return { properties, cleaned: cleanedLines.join('\n') };
  }

  function extractTags(content: string): { tags: string[]; cleaned: string } {
    const tags: string[] = [];
    const tagPattern = /(?:^|\s)(#(\w+)|#\[\[([^\]]+)\]\])/g;
    let match;
    const cleaned = content;
    
    while ((match = tagPattern.exec(content)) !== null) {
      const tag = match[2] || match[3];
      if (tag) tags.push(tag);
    }
    
    return { tags, cleaned };
  }

  function extractReferences(content: string): { references: string[]; blockRefs: string[] } {
    const references: string[] = [];
    const blockRefs: string[] = [];
    
    const pageRefPattern = /\[\[([^\]]+)\]\]/g;
    let match;
    while ((match = pageRefPattern.exec(content)) !== null) {
      references.push(match[1]);
    }
    
    const blockRefPattern = /\(\(([^)]+)\)\)/g;
    while ((match = blockRefPattern.exec(content)) !== null) {
      blockRefs.push(match[1]);
    }
    
    return { references, blockRefs };
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }
    
    const { level, content: rawContent, isBullet } = parseLine(line);
    
    // Only process lines that are actual bullets (parseLine found a bullet marker)
    if (!isBullet) {
      continue;
    }
    
    const { id, cleaned: content1 } = extractBlockId(rawContent);
    const { properties, cleaned: content2 } = extractProperties(content1);
    const { tags, cleaned: content3 } = extractTags(content2);
    const { references, blockRefs } = extractReferences(content3);
    
    // Don't skip empty content - keep it as is (LogSeq allows empty bullets)
    const finalContent = content3.trim();
    
    const block: Block = {
      id,
      content: finalContent,
      level,
      children: [],
      properties,
      tags,
      references,
      blockRefs,
    };

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      blocks.push(block);
    } else {
      stack[stack.length - 1].children.push(block);
    }

    stack.push(block);
  }

  return blocks;
}

export function getAllBlocks(blocks: Block[]): Block[] {
  const all: Block[] = [];
  
  function traverse(bs: Block[]) {
    for (const block of bs) {
      all.push(block);
      if (block.children.length > 0) {
        traverse(block.children);
      }
    }
  }
  
  traverse(blocks);
  return all;
}

