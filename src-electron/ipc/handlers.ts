import { ipcMain, dialog, shell } from 'electron';
import { getSettings, setSettings, getContextSettings } from '../store/settings';
import { Settings } from '../types';
import { scanLogseqDirectory, readMarkdownFile, writeMarkdownFile, parseMarkdown } from '../filesystem/scanner';
import { watchLogseqDirectory } from '../filesystem/watcher';
import { searchGraph, getPage, getJournal, getConnectedPages, traverseGraph, findRelatedPages, findOrphanedPages, getBlockById } from '../graph/search';
import { buildIndex, getIndex } from '../graph/index';
import { chatWithLLM, createProvider } from '../llm/provider';
import {
  createConversation,
  getConversation,
  getConversationMetadata,
  saveConversation,
  deleteConversation,
  getActiveConversationId,
  setActiveConversationId,
  searchConversations,
  clearAllConversations,
  updateConversationTitle,
} from '../store/conversations';
import { formatConversationAsMarkdown, sanitizeFilename } from '../store/conversationExport';
import { Conversation } from '../types';
import { writeFile } from 'fs/promises';

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
        const files = await scanLogseqDirectory(settings.logseqPath);
        console.log('[ipc/handlers] Found', files.length, 'files');
        const journalFiles = files.filter(f => f.includes('journals/'));
        console.log('[ipc/handlers] Journal files:', journalFiles);
        await buildIndex(files, settings.logseqPath);
        watchLogseqDirectory(settings.logseqPath);
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
    return scanLogseqDirectory(path);
  });

  ipcMain.handle('read-file', async (_event, path: string) => {
    return readMarkdownFile(path);
  });

  // Rebuild index on demand
  ipcMain.handle('rebuild-index', async () => {
    const settings = getSettings();
    if (!settings.logseqPath) {
      console.warn('[ipc/handlers] rebuild-index: No logseqPath set');
      return { pages: 0, journals: 0 };
    }
    console.log('[ipc/handlers] Rebuilding index for path:', settings.logseqPath);
    const files = await scanLogseqDirectory(settings.logseqPath);
    await buildIndex(files, settings.logseqPath);
    const journalCount = files.filter((f) => f.includes('/journals/')).length;
    console.log('[ipc/handlers] Rebuild complete. Files:', files.length, 'journal files:', journalCount);
    return { files: files.length, journalFiles: journalCount };
  });

  // Get current in-memory index stats
  ipcMain.handle('get-index-stats', () => {
    const idx = getIndex();
    const pagesCount = idx.pages.size;
    const journalsCount = Array.from(idx.pages.keys()).filter((k: string) => k.startsWith('journals/')).length;
    return { pages: pagesCount, journals: journalsCount };
  });

  ipcMain.handle('write-file', async (_event, path: string, content: string) => {
    return writeMarkdownFile(path, content);
  });

  ipcMain.handle('watch-directory', async (_event, path: string) => {
    watchLogseqDirectory(path);
  });

  // Search
  ipcMain.handle('search', async (_event, query: string) => {
    const contextSettings = getContextSettings();
    return searchGraph(query, {
      relevanceThreshold: contextSettings.relevanceThreshold,
      searchResultLimit: contextSettings.searchResultLimit,
    });
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
          // Strip 'pages/' prefix if present
          const cleanPageName = pageName.startsWith('pages/') ? pageName.replace('pages/', '') : pageName;
          const sanitized = sanitizePageName(cleanPageName);
          filePath = `${settings.logseqPath}/pages/${sanitized}.md`;
        }
        console.log('[ipc/handlers] Attempting to read file directly:', filePath);
        try {
          const content = await readMarkdownFile(filePath);
          console.log('[ipc/handlers] Successfully read file, length:', content.length);
          
          // Parse and format the content directly
          const { frontmatter, body } = parseMarkdown(content);
          const { parseLogseqContent, getAllBlocks } = await import('../graph/parser');
          const blocks = parseLogseqContent(body);
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
            const files = await scanLogseqDirectory(settings.logseqPath);
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
          
          const { parseLogseqContent, getAllBlocks } = await import('../graph/parser');
          const blocks = parseLogseqContent(body);
          const allBlocks = getAllBlocks(blocks);
          
          console.log('[ipc/handlers] Parsed journal blocks:', allBlocks.length);
          allBlocks.forEach((b, idx) => {
            console.log(`[ipc/handlers] Block ${idx}: level=${b.level}, content='${b.content}' (length=${b.content.length}), hasId=${!!b.id}`);
          });
          
          // Filter out blocks with completely empty content UNLESS they're intentionally empty bullets
          const validBlocks = allBlocks.filter(b => {
            // Keep blocks even if content is empty (Logseq allows empty bullets)
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

  ipcMain.handle('get-block-by-id', async (_event, blockId: string) => {
    console.log('[ipc/handlers] get-block-by-id called for:', blockId);
    return getBlockById(blockId);
  });

  ipcMain.handle('get-block-with-context', async (_event, blockId: string) => {
    console.log('[ipc/handlers] get-block-with-context called for:', blockId);
    return getBlockById(blockId);
  });

  // Graph traversal queries
  ipcMain.handle('get-connected-pages', async (_event, pageName: string) => {
    return getConnectedPages(pageName);
  });

  ipcMain.handle('traverse-graph', async (_event, pageName: string, maxHops?: number) => {
    return traverseGraph(pageName, maxHops ?? 3);
  });

  ipcMain.handle('find-related-pages', async (_event, pageName: string, options?: { maxHops?: number; minConnections?: number }) => {
    return findRelatedPages(pageName, options);
  });

  ipcMain.handle('find-orphaned-pages', async (_event, options?: { includeTagged?: boolean }) => {
    return findOrphanedPages(options);
  });

  // LLM
  ipcMain.handle('chat', async (_event, messages: Array<{ role: string; content: string }>, context: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }> | undefined) => {
    const settings = getSettings();
    return chatWithLLM(settings.provider, messages, context);
  });

  // Streaming LLM
  ipcMain.on('chat-stream-start', async (event, { messages, context }: { messages: Array<{ role: string; content: string }>; context: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }> | undefined }) => {
    const settings = getSettings();
    const providerConfig = settings.providers?.[settings.provider];
    
    if (!providerConfig) {
      event.sender.send('chat-stream-error', { error: `${settings.provider} provider not configured` });
      return;
    }

    try {
      const provider = createProvider(settings.provider, providerConfig);
      let fullContent = '';
      
      await provider.chatStream(
        messages,
        context,
        (token: string) => {
          fullContent += token;
          event.sender.send('chat-stream-token', { token });
        }
      );

      event.sender.send('chat-stream-end', { fullContent });
    } catch (error) {
      console.error('[ipc/handlers] Streaming error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      event.sender.send('chat-stream-error', { error: errorMessage });
      
      // Fallback to non-streaming mode
      try {
        const response = await chatWithLLM(settings.provider, messages, context);
        event.sender.send('chat-stream-fallback', { response });
      } catch (fallbackError) {
        console.error('[ipc/handlers] Fallback also failed:', fallbackError);
        event.sender.send('chat-stream-error', { error: 'Streaming failed and fallback also failed' });
      }
    }
  });

  // Content creation
  ipcMain.handle('create-journal-entry', async (_event, dateStr: string, content: string) => {
    const settings = getSettings();
    if (!settings.logseqPath) {
      throw new Error('Logseq path not configured');
    }

    const date = new Date(dateStr);
    const dateFilename = `${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}_${String(date.getDate()).padStart(2, '0')}`;
    const journalPath = `${settings.logseqPath}/journals/${dateFilename}.md`;
    console.log('[content/create-journal-entry] Target path:', journalPath);
    
    let existing = '';
    try {
      existing = await readMarkdownFile(journalPath);
      console.log('[content/create-journal-entry] Existing file found, current length:', existing.length);
      if (!existing.endsWith('\n')) existing += '\n';
      if (!existing.endsWith('\n\n')) existing += '\n';
    } catch {
      // New journal entry
      const formattedDate = formatDateForJournal(date);
      existing = `# ${formattedDate}\n\n`;
      console.log('[content/create-journal-entry] Creating new journal with header for date:', formattedDate);
    }
    
    const journalContent = existing + content;
    console.log('[content/create-journal-entry] Appending content length:', content.length, 'New total length:', journalContent.length);
    await writeMarkdownFile(journalPath, journalContent);
    try {
      const { stat } = await import('fs/promises');
      const st = await stat(journalPath);
      console.log('[content/create-journal-entry] Write success. Final size (bytes):', st.size);
    } catch (e) {
      console.warn('[content/create-journal-entry] Could not stat file after write:', e);
    }
    return journalPath;
  });

  ipcMain.handle('create-page', async (_event, pageName: string, content: string) => {
    const settings = getSettings();
    if (!settings.logseqPath) {
      throw new Error('Logseq path not configured');
    }

    // Strip 'pages/' prefix if present (should not be included in pageName)
    const cleanPageName = pageName.startsWith('pages/') ? pageName.replace('pages/', '') : pageName;
    const sanitized = sanitizePageName(cleanPageName);
    const pagePath = `${settings.logseqPath}/pages/${sanitized}.md`;
    const pageContent = `---\ntitle: ${cleanPageName}\n---\n\n${content}`;
    
    await writeMarkdownFile(pagePath, pageContent);
    return pagePath;
  });

  ipcMain.handle('append-to-page', async (_event, pageName: string, content: string) => {
    const settings = getSettings();
    if (!settings.logseqPath) {
      throw new Error('Logseq path not configured');
    }

    // Handle journal entries (format: journals/2025_10_29 or journals/YYYY_MM_DD)
    if (pageName.startsWith('journals/')) {
      const journalDate = pageName.replace('journals/', '');
      const journalPath = `${settings.logseqPath}/journals/${journalDate}.md`;
      console.log('[content/append] Journals branch. pageName:', pageName, '-> path:', journalPath);
      
      let existing = '';
      try {
        existing = await readMarkdownFile(journalPath);
        console.log('[content/append] Existing journal found. Current length:', existing.length);
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
          console.log('[content/append] Journal not found. Creating header for date:', formatDateForJournal(date));
        } else {
          existing = '';
          console.warn('[content/append] Unexpected journal date format in pageName:', pageName);
        }
      }
      
      const updated = existing + content;
      console.log('[content/append] Appending content length:', content.length, 'Result total length:', updated.length);
      await writeMarkdownFile(journalPath, updated);
      try {
        const { stat } = await import('fs/promises');
        const st = await stat(journalPath);
        console.log('[content/append] Write success. Final size (bytes):', st.size);
      } catch (e) {
        console.warn('[content/append] Could not stat journal after write:', e);
      }
      return journalPath;
    } else {
      // Handle regular pages
      // Strip 'pages/' prefix if present (should not be included in pageName)
      const cleanPageName = pageName.startsWith('pages/') ? pageName.replace('pages/', '') : pageName;
      const sanitized = sanitizePageName(cleanPageName);
      const pagePath = `${settings.logseqPath}/pages/${sanitized}.md`;
      console.log('[content/append] Page branch. pageName:', pageName, 'cleanPageName:', cleanPageName, 'sanitized:', sanitized, '-> path:', pagePath);
      
      let existing = '';
      try {
        existing = await readMarkdownFile(pagePath);
        console.log('[content/append] Existing page found. Current length:', existing.length);
        if (!existing.endsWith('\n')) existing += '\n';
      } catch {
        // File doesn't exist yet
        console.log('[content/append] Page does not exist. Will create new file.');
      }
      
      const updated = existing + content;
      console.log('[content/append] Appending content length:', content.length, 'Result total length:', updated.length);
      await writeMarkdownFile(pagePath, updated);
      try {
        const { stat } = await import('fs/promises');
        const st = await stat(pagePath);
        console.log('[content/append] Write success. Final size (bytes):', st.size);
      } catch (e) {
        console.warn('[content/append] Could not stat page after write:', e);
      }
      return pagePath;
    }
  });

  // Conversations
  ipcMain.handle('get-conversations', async () => {
    return getConversationMetadata();
  });

  ipcMain.handle('get-conversation', async (_event, id: string) => {
    return getConversation(id);
  });

  ipcMain.handle('create-conversation', async (_event, title: string) => {
    return createConversation(title);
  });

  ipcMain.handle('save-conversation', async (_event, conversation: Conversation) => {
    saveConversation(conversation);
    return conversation;
  });

  ipcMain.handle('delete-conversation', async (_event, id: string) => {
    deleteConversation(id);
  });

  ipcMain.handle('get-active-conversation-id', async () => {
    return getActiveConversationId();
  });

  ipcMain.handle('set-active-conversation-id', async (_event, id: string | null) => {
    setActiveConversationId(id);
  });

  ipcMain.handle('search-conversations', async (_event, query: string) => {
    return searchConversations(query);
  });

  ipcMain.handle('clear-all-conversations', async () => {
    clearAllConversations();
  });

  ipcMain.handle('update-conversation-title', async (_event, id: string, title: string) => {
    updateConversationTitle(id, title);
  });

  ipcMain.handle('export-conversation', async (_event, id: string, defaultPath?: string) => {
    const conversation = getConversation(id);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const markdown = formatConversationAsMarkdown(conversation);
    const sanitizedTitle = sanitizeFilename(conversation.title);
    const dateStr = new Date(conversation.createdAt).toISOString().split('T')[0];
    const defaultFilename = `${sanitizedTitle}_${dateStr}.md`;

    const result = await dialog.showSaveDialog({
      defaultPath: defaultPath || defaultFilename,
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    await writeFile(result.filePath, markdown, 'utf-8');
    return result.filePath;
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

