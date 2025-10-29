import { ipcMain, dialog } from 'electron';
import { getSettings, setSettings } from '../store/settings';
import { Settings } from '../types';
import { scanLogSeqDirectory, readMarkdownFile, writeMarkdownFile } from '../filesystem/scanner';
import { watchLogSeqDirectory } from '../filesystem/watcher';
import { searchGraph } from '../graph/search';
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
        const files = await scanLogSeqDirectory(settings.logseqPath);
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

