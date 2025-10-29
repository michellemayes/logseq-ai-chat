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

