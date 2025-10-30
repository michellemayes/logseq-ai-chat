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
        
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile() && extname(entry.name) === '.md') {
          files.push(fullPath);
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
  newStatus: 'TODO' | 'DOING' | 'DONE' | 'LATER' | 'NOW' | 'WAITING' | 'CANCELED'
): Promise<void> {
  const content = await readMarkdownFile(filePath);
  const lines = content.split('\n');
  const { parseLogseqContent, getAllBlocks } = await import('../graph/parser');
  
  // Parse the content to find the block
  const { body } = parseMarkdown(content);
  const blocks = parseLogseqContent(body);
  const allBlocks = getAllBlocks(blocks);
  
  // Find the block by ID
  const blockIndex = allBlocks.findIndex(b => b.id === blockId);
  if (blockIndex === -1) {
    throw new Error(`Block with ID ${blockId} not found in file ${filePath}`);
  }
  
  const block = allBlocks[blockIndex];
  const originalContent = block.content;
  
  // Determine original task status and content without status
  let contentWithoutStatus = originalContent;
  const taskStatusPattern = /^(TODO|DOING|DONE|LATER|NOW|WAITING|CANCELED)\s+(.+)$/i;
  const match = originalContent.match(taskStatusPattern);
  
  if (match) {
    contentWithoutStatus = match[2];
  }
  
  // Construct new content with new status
  const newContent = newStatus === 'DONE' ? contentWithoutStatus : `${newStatus} ${contentWithoutStatus}`;
  
  // Find the line in the original file and update it
  // We need to match the block content in the file
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match bullet with content
    const bulletMatch = line.match(/^(\s*)(?:[-*+]|\d+\.)\s+(.+)$/);
    if (bulletMatch) {
      const lineContent = bulletMatch[2];
      
      // Check if this line contains the block ID and original content
      if (lineContent.includes(blockId) && (lineContent.includes(originalContent) || originalContent.includes(lineContent))) {
        // Extract indentation
        const indent = bulletMatch[1];
        const bullet = bulletMatch[0].match(/^(\s*)([-*+]|\d+\.)/)?.[2] || '-';
        
        // Reconstruct the line with new task status
        // Preserve block ID if present
        const hasBlockId = lineContent.includes(blockId);
        const blockIdPart = hasBlockId ? `${blockId} ` : '';
        const newLine = `${indent}${bullet} ${blockIdPart}${newContent}`;
        lines[i] = newLine;
        break;
      }
    }
  }
  
  // Write updated content back
  const updatedContent = lines.join('\n');
  await writeMarkdownFile(filePath, updatedContent);
}

