import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import matter from 'gray-matter';

export async function scanLogseqDirectory(rootPath: string): Promise<string[]> {
  const files: string[] = [];
  
  async function scanDir(dir: string) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        // Skip backup directories (any directory named "bak" or containing "/bak/" or "\bak\")
        if (entry.isDirectory()) {
          const normalizedPath = fullPath.replace(/\\/g, '/');
          if (entry.name.toLowerCase() === 'bak' || normalizedPath.includes('/bak/')) {
            continue;
          }
          await scanDir(fullPath);
        } else if (entry.isFile() && extname(entry.name) === '.md') {
          // Skip files in backup directories
          const normalizedPath = fullPath.replace(/\\/g, '/');
          if (!normalizedPath.includes('/bak/')) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`[scanner] Error scanning directory ${dir}:`, error);
    }
  }
  
  await scanDir(rootPath);
  return files;
}

export async function readMarkdownFile(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`[scanner] Failed to read file ${filePath}:`, error);
    throw new Error(`Failed to read file ${filePath}: ${error}`);
  }
}

export async function writeMarkdownFile(filePath: string, content: string): Promise<void> {
  try {
    const { writeFile, mkdir } = await import('fs/promises');
    const { dirname } = await import('path');
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write file ${filePath}: ${errorMessage}`);
  }
}

export function parseMarkdown(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const parsed = matter(content);
  return {
    frontmatter: parsed.data as Record<string, unknown>,
    body: parsed.content,
  };
}

export async function updateTaskStatus(
  filePath: string,
  blockId: string,
  newStatus: 'TODO' | 'DOING' | 'DONE' | 'LATER' | 'NOW' | 'WAITING' | 'CANCELED',
  taskContent?: string // Optional: task content without status for fallback matching
): Promise<void> {
  const content = await readMarkdownFile(filePath);
  const lines = content.split('\n');
  const { parseLogseqContent, getAllBlocks } = await import('../graph/parser');
  
  // Parse the content to find the block
  const { body } = parseMarkdown(content);
  const blocks = parseLogseqContent(body);
  const allBlocks = getAllBlocks(blocks);
  
  let block: { content: string; id?: string } | null = null;
  let contentWithoutStatus = '';
  
  // Try to find block by ID first (if blockId looks like a valid block ID - 13 characters)
  if (blockId && blockId.length === 13 && /^[a-zA-Z0-9]+$/.test(blockId)) {
    const blockIndex = allBlocks.findIndex(b => b.id === blockId);
    if (blockIndex !== -1) {
      block = allBlocks[blockIndex];
    }
  }
  
  // If block not found by ID, try to match by content
  if (!block) {
    // Use provided taskContent or try to extract from blockId if it's actually content
    let searchContent = taskContent || blockId;
    
    // Strip task status prefix from searchContent if present
    const taskStatusPattern = /^(TODO|DOING|DONE|LATER|NOW|WAITING|CANCELED)\s+(.+)$/i;
    const statusMatch = searchContent.match(taskStatusPattern);
    if (statusMatch) {
      searchContent = statusMatch[2].trim();
    } else {
      searchContent = searchContent.trim();
    }
    
    // Find block by matching content (excluding task status prefix)
    for (const b of allBlocks) {
      const match = b.content.match(taskStatusPattern);
      const blockContentWithoutStatus = match ? match[2].trim() : b.content.trim();
      
      // Match if the content without status matches (case-insensitive, partial match)
      const searchLower = searchContent.toLowerCase();
      const blockLower = blockContentWithoutStatus.toLowerCase();
      
      if (blockLower === searchLower || 
          blockLower.includes(searchLower) ||
          searchLower.includes(blockLower)) {
        block = b;
        break;
      }
    }
  }
  
  if (!block) {
    throw new Error(`Task not found in file ${filePath}. Searched for blockId: ${blockId}, content: ${taskContent || 'N/A'}`);
  }
  
  const originalContent = block.content;
  
  // Determine original task status and content without status
  const taskStatusPattern = /^(TODO|DOING|DONE|LATER|NOW|WAITING|CANCELED)\s+(.+)$/i;
  const match = originalContent.match(taskStatusPattern);
  
  if (match) {
    contentWithoutStatus = match[2];
  } else {
    contentWithoutStatus = originalContent;
  }
  
  // Construct new content with new status
  // Always include the status prefix for clarity
  const newContent = `${newStatus} ${contentWithoutStatus}`;
  
  console.log(`[scanner] updateTaskStatus: blockId=${blockId}, newStatus=${newStatus}, contentWithoutStatus="${contentWithoutStatus}", newContent="${newContent}"`);
  
  // Find the line in the original file and update it
  let lineFound = false;
  let matchedLineIndex = -1;
  
  // Normalize content for comparison
  const normalizedContentWithoutStatus = (match ? match[2] : originalContent).trim().toLowerCase();
  const originalStatus = match ? match[1].toUpperCase() : null;
  
  console.log(`[scanner] Searching for line with content: "${normalizedContentWithoutStatus}"`);
  console.log(`[scanner] Original status from block: "${originalStatus}", new status: "${newStatus}"`);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match bullet with content
    const bulletMatch = line.match(/^(\s*)(?:[-*+]|\d+\.)\s+(.+)$/);
    if (!bulletMatch) continue;
    
    const lineContent = bulletMatch[2];
    
    // Extract block ID from line if present (13-character alphanumeric at start)
    const blockIdMatch = lineContent.match(/^([a-zA-Z0-9]{13})\s+(.+)$/);
    const lineContentWithoutBlockId = blockIdMatch ? blockIdMatch[2] : lineContent;
    
    // Extract task status from line content
    const lineTaskStatusMatch = lineContentWithoutBlockId.match(/^(TODO|DOING|DONE|LATER|NOW|WAITING|CANCELED)\s+(.+)$/i);
    const lineStatus = lineTaskStatusMatch ? lineTaskStatusMatch[1].toUpperCase() : null;
    const lineContentWithoutStatus = lineTaskStatusMatch ? lineTaskStatusMatch[2].trim() : lineContentWithoutBlockId.trim();
    
    // Check if this line matches the block we want to update
    const hasBlockId = block.id && lineContent.includes(block.id);
    
    // Match by content (use exact match first, then fallback to includes)
    const normalizedLineContent = lineContentWithoutStatus.toLowerCase();
    const exactMatch = normalizedLineContent === normalizedContentWithoutStatus;
    const containsMatch = normalizedLineContent.includes(normalizedContentWithoutStatus) || 
                          normalizedContentWithoutStatus.includes(normalizedLineContent);
    
  // Prefer lines that match the original status (if we know it)
  const statusMatches = originalStatus ? lineStatus === originalStatus : true;
    
  // Prefer exact matches, but allow contains matches if no exact match found
  if (hasBlockId || exactMatch || (containsMatch && !lineFound)) {
      // If we already found a match and this is a contains match, skip duplicates
      // But prefer matches with the original status
      if (lineFound && !hasBlockId && !exactMatch) {
        // If we have a status match, prefer this one over the previous
        if (statusMatches && originalStatus) {
          // Keep this match instead
        } else {
          continue;
        }
      }
      
      lineFound = true;
      matchedLineIndex = i;
      
      // Extract indentation and bullet
      const indent = bulletMatch[1];
      const bullet = bulletMatch[0].match(/^(\s*)([-*+]|\d+\.)/)?.[2] || '-';
      
      // Preserve block ID if present
      const blockIdPart = hasBlockId && block.id ? `${block.id} ` : '';
      
      // Construct new line with new task status
      const newLine = `${indent}${bullet} ${blockIdPart}${newContent}`;
      
      console.log(`[scanner] Matched line ${i}: "${line.trim()}" (status: ${lineStatus})`);
      console.log(`[scanner] Will update to: "${newLine.trim()}"`);
      
      // If we have an exact match or block ID, update immediately
      if (hasBlockId || exactMatch) {
        lines[i] = newLine;
        break;
      }
    }
  }
  
  // Update the matched line if we found one
  if (lineFound && matchedLineIndex >= 0) {
    const line = lines[matchedLineIndex];
    const bulletMatch = line.match(/^(\s*)(?:[-*+]|\d+\.)\s+(.+)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1];
      const bullet = bulletMatch[0].match(/^(\s*)([-*+]|\d+\.)/)?.[2] || '-';
      const hasBlockId = block.id && bulletMatch[2].includes(block.id);
      const blockIdPart = hasBlockId && block.id ? `${block.id} ` : '';
      const newLine = `${indent}${bullet} ${blockIdPart}${newContent}`;
      
      lines[matchedLineIndex] = newLine;
      console.log(`[scanner] Updated task status: "${line.trim()}" -> "${newLine.trim()}"`);
    }
  } else {
    // Log all potential matches for debugging
    console.log(`[scanner] No line found. Searched for content: "${normalizedContentWithoutStatus}"`);
    console.log(`[scanner] Available lines in file:`);
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const bulletMatch = lines[i].match(/^(\s*)(?:[-*+]|\d+\.)\s+(.+)$/);
      if (bulletMatch) {
        console.log(`[scanner]   Line ${i}: "${bulletMatch[2].trim()}"`);
      }
    }
    throw new Error(`Could not find line to update in file ${filePath}. Searched for content: "${contentWithoutStatus}"`);
  }
  
  // Write updated content back
  const updatedContent = lines.join('\n');
  console.log(`[scanner] Writing updated content to file: ${filePath}`);
  console.log(`[scanner] Content length: ${updatedContent.length} characters`);
  await writeMarkdownFile(filePath, updatedContent);
  console.log(`[scanner] Successfully wrote updated content to file`);
}

