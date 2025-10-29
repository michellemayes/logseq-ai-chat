import { ipcMain, dialog, shell } from 'electron';
import { getSettings, setSettings } from '../store/settings';
import { Settings } from '../types';
import { scanLogSeqDirectory, readMarkdownFile, writeMarkdownFile, parseMarkdown } from '../filesystem/scanner';
import { watchLogSeqDirectory } from '../filesystem/watcher';
import { searchGraph, getPage, getJournal } from '../graph/search';
import { chatWithLLM } from '../llm/provider';
import { buildIndex } from '../graph/index';

export function setupIpcHandlers() {
  // Settings
  ipcMain.handle('get-settings', async () => {
    return getSettings();
  });

  ipcMain.handle('set-settings', async (_event, updates: Partial<Settings>) => {
    setSettings(updates);
    const settings = getSettings();
    
    if (settings.logseqPath) {
      try {
        console.log('[ipc/handlers] Building index for path:', settings.logseqPath);
        const files = await scanLogSeqDirectory(settings.logseqPath);
        console.log('[ipc/handlers] Found', files.length, 'files');
        const journalFiles = files.filter(f => f.includes('journals/'));
        console.log('[ipc/handlers] Journal files:', journalFiles);
        await buildIndex(files, settings.logseqPath);
        watchLogSeqDirectory(settings.logseqPath);
      } catch (error) {
        console.error('Error initializing index:', error);
      }
    }
    
    return settings;
  });

  ipcMain.handle('browse-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // File system
  ipcMain.handle('scan-directory', async (_event, path: string) => {
    return scanLogSeqDirectory(path);
  });

  ipcMain.handle('read-file', async (_event, path: string) => {
    return readMarkdownFile(path);
  });

  ipcMain.handle('write-file', async (_event, path: string, content: string) => {
    return writeMarkdownFile(path, content);
  });

  ipcMain.handle('watch-directory', async (_event, path: string) => {
    watchLogSeqDirectory(path);
  });

  // Search
  ipcMain.handle('search', async (_event, query: string) => {
    return searchGraph(query);
  });

  // Graph queries
  ipcMain.handle('get-page', async (_event, pageName: string) => {
    console.log('[ipc/handlers] get-page called for:', pageName);
    let result = getPage(pageName);
    
    if (!result) {
      // If not found in index, try reading file directly as fallback
      const settings = getSettings();
      if (settings.logseqPath) {
        console.log('[ipc/handlers] Page not in index, trying direct file read');
        let filePath: string;
        if (pageName.startsWith('journals/')) {
          const dateStr = pageName.replace('journals/', '');
          filePath = `${settings.logseqPath}/journals/${dateStr}.md`;
        } else {
          const sanitized = pageName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
          filePath = `${settings.logseqPath}/pages/${sanitized}.md`;
        }
        console.log('[ipc/handlers] Attempting to read file directly:', filePath);
        try {
          const content = await readMarkdownFile(filePath);
          console.log('[ipc/handlers] Successfully read file, length:', content.length);
          
          // Parse and format the content directly
          const { frontmatter, body } = parseMarkdown(content);
          const { parseLogSeqContent, getAllBlocks } = await import('../graph/parser');
          const blocks = parseLogSeqContent(body);
          const allBlocks = getAllBlocks(blocks);
          
          result = {
            pageName: pageName,
            path: filePath,
            frontmatter: frontmatter,
            blocks: allBlocks.map(b => ({
              id: b.id,
              content: b.content,
              level: b.level,
              properties: b.properties,
              tags: b.tags,
              references: b.references,
              blockRefs: b.blockRefs,
            })),
            allTags: Array.from(new Set(allBlocks.flatMap(b => b.tags))),
            allProperties: Object.assign({}, ...allBlocks.map(b => b.properties)),
          };
          
          console.log('[ipc/handlers] Created page content from direct read:', result.blocks.length, 'blocks');
          
          // Also rebuild index for future queries
          try {
            const files = await scanLogSeqDirectory(settings.logseqPath);
            await buildIndex(files, settings.logseqPath);
          } catch (indexError) {
            console.error('[ipc/handlers] Failed to rebuild index:', indexError);
          }
        } catch (error) {
          console.error('[ipc/handlers] Failed to read file directly:', error);
        }
      }
    }
    
    if (result) {
      console.log('[ipc/handlers] Returning page:', result.pageName, 'with', result.blocks.length, 'blocks');
    } else {
      console.log('[ipc/handlers] Page not found and could not read file directly');
    }
    
    return result;
  });

  // File operations
  ipcMain.handle('open-file', async (_event, filePath: string) => {
    console.log('[ipc/handlers] Opening file:', filePath);
    try {
      await shell.openPath(filePath);
    } catch (error) {
      console.error('[ipc/handlers] Failed to open file:', error);
      throw error;
    }
  });

  ipcMain.handle('get-journal', async (_event, dateStr: string) => {
    console.log('[ipc/handlers] get-journal called for date:', dateStr);
    let result = getJournal(dateStr);
    
    // If not found in index, read directly from file
    if (!result) {
      const settings = getSettings();
      if (settings.logseqPath) {
        const dateFilename = dateStr.replace(/-/g, '_');
        const filePath = `${settings.logseqPath}/journals/${dateFilename}.md`;
        console.log('[ipc/handlers] Journal not in index, reading directly:', filePath);
        
        try {
          const content = await readMarkdownFile(filePath);
          console.log('[ipc/handlers] Successfully read journal file, length:', content.length);
          console.log('[ipc/handlers] Journal file content preview:', content.substring(0, 200));
          
          // Parse and format the content directly
          const { frontmatter, body } = parseMarkdown(content);
          console.log('[ipc/handlers] Body to parse (first 500 chars):', body.substring(0, 500));
          
          const { parseLogSeqContent, getAllBlocks } = await import('../graph/parser');
          const blocks = parseLogSeqContent(body);
          const allBlocks = getAllBlocks(blocks);
          
          console.log('[ipc/handlers] Parsed journal blocks:', allBlocks.length);
          allBlocks.forEach((b, idx) => {
            console.log(`[ipc/handlers] Block ${idx}: level=${b.level}, content='${b.content}' (length=${b.content.length}), hasId=${!!b.id}`);
          });
          
          // Filter out blocks with completely empty content UNLESS they're intentionally empty bullets
          const validBlocks = allBlocks.filter(b => {
            // Keep blocks even if content is empty (LogSeq allows empty bullets)
            // But log them for debugging
            if (!b.content || b.content.trim() === '') {
              console.log(`[ipc/handlers] Found empty block at index ${allBlocks.indexOf(b)}`);
            }
            return true; // Keep all blocks for now
          });
          
          console.log('[ipc/handlers] Valid blocks after filtering:', validBlocks.length);
          
          const journalPageName = `journals/${dateFilename}`;
          result = {
            pageName: journalPageName,
            path: filePath,
            frontmatter: frontmatter,
            blocks: validBlocks.map(b => ({
              id: b.id,
              content: b.content || '', // Ensure content is at least empty string
              level: b.level,
              properties: b.properties,
              tags: b.tags,
              references: b.references,
              blockRefs: b.blockRefs,
            })),
            allTags: Array.from(new Set(validBlocks.flatMap(b => b.tags))),
            allProperties: Object.assign({}, ...validBlocks.map(b => b.properties)),
          };
          
          console.log('[ipc/handlers] Created journal content from direct read:', result.blocks.length, 'blocks');
        } catch (error) {
          console.error('[ipc/handlers] Failed to read journal file directly:', error);
          if (error instanceof Error) {
            console.error('[ipc/handlers] Error details:', error.message, error.stack);
          }
        }
      }
    }
    
    if (result) {
      console.log('[ipc/handlers] Returning journal:', result.pageName, 'with', result.blocks.length, 'blocks');
    } else {
      console.log('[ipc/handlers] Journal not found and could not read file directly');
    }
    
    return result;
  });

  // LLM
  ipcMain.handle('chat', async (_event, messages: Array<{ role: string; content: string }>, context: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string }> }> | undefined) => {
    const settings = getSettings();
    return chatWithLLM(settings.provider, messages, context);
  });

  // Content creation
  ipcMain.handle('create-journal-entry', async (_event, dateStr: string, content: string) => {
    const settings = getSettings();
    if (!settings.logseqPath) {
      throw new Error('LogSeq path not configured');
    }

    const date = new Date(dateStr);
    const dateFilename = `${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}_${String(date.getDate()).padStart(2, '0')}`;
    const journalPath = `${settings.logseqPath}/journals/${dateFilename}.md`;
    
    let existing = '';
    try {
      existing = await readMarkdownFile(journalPath);
      if (!existing.endsWith('\n')) existing += '\n';
      if (!existing.endsWith('\n\n')) existing += '\n';
    } catch {
      // New journal entry
      const formattedDate = formatDateForJournal(date);
      existing = `# ${formattedDate}\n\n`;
    }
    
    const journalContent = existing + content;
    await writeMarkdownFile(journalPath, journalContent);
    return journalPath;
  });

  ipcMain.handle('create-page', async (_event, pageName: string, content: string) => {
    const settings = getSettings();
    if (!settings.logseqPath) {
      throw new Error('LogSeq path not configured');
    }

    const sanitized = sanitizePageName(pageName);
    const pagePath = `${settings.logseqPath}/pages/${sanitized}.md`;
    const pageContent = `---\ntitle: ${pageName}\n---\n\n${content}`;
    
    await writeMarkdownFile(pagePath, pageContent);
    return pagePath;
  });

  ipcMain.handle('append-to-page', async (_event, pageName: string, content: string) => {
    const settings = getSettings();
    if (!settings.logseqPath) {
      throw new Error('LogSeq path not configured');
    }

    // Handle journal entries (format: journals/2025_10_29 or journals/YYYY_MM_DD)
    if (pageName.startsWith('journals/')) {
      const journalDate = pageName.replace('journals/', '');
      const journalPath = `${settings.logseqPath}/journals/${journalDate}.md`;
      
      let existing = '';
      try {
        existing = await readMarkdownFile(journalPath);
        if (!existing.endsWith('\n')) existing += '\n';
        if (!existing.endsWith('\n\n')) existing += '\n';
      } catch {
        // Journal doesn't exist yet - create header
        const dateParts = journalDate.split('_');
        if (dateParts.length === 3) {
          const date = new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2])
          );
          existing = `# ${formatDateForJournal(date)}\n\n`;
        } else {
          existing = '';
        }
      }
      
      const updated = existing + content;
      await writeMarkdownFile(journalPath, updated);
      return journalPath;
    } else {
      // Handle regular pages
      const sanitized = sanitizePageName(pageName);
      const pagePath = `${settings.logseqPath}/pages/${sanitized}.md`;
      
      let existing = '';
      try {
        existing = await readMarkdownFile(pagePath);
        if (!existing.endsWith('\n')) existing += '\n';
      } catch {
        // File doesn't exist yet
      }
      
      const updated = existing + content;
      await writeMarkdownFile(pagePath, updated);
      return pagePath;
    }
  });
}

function formatDateForJournal(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[date.getDay()];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const ordinal = getOrdinal(day);
  
  return `${dayName}, ${month} ${day}${ordinal}, ${year}`;
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function sanitizePageName(name: string): string {
  return name
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

