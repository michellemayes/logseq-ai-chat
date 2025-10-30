import { useState, useRef, useEffect, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  getDefaultContextSettings, 
  filterBlocks, 
  shouldExcludePage, 
  isJournalInRange,
  formatBlocksAsMarkdown
} from '@electron/utils/contextFiltering';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import Header from './Header';
import { Conversation, Message } from '../types';
import './ChatInterface.css';

interface ChatInterfaceProps {
  onOpenSidebar: () => void;
  onOpenConversations: () => void;
  conversationId?: string | null;
  onConversationChange?: (id: string | null) => void;
}

export default function ChatInterface({ onOpenSidebar, onOpenConversations, conversationId, onConversationChange }: ChatInterfaceProps) {
  const { settings } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [activeConversationTitle, setActiveConversationTitle] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastActionKeyRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Load conversation on mount or when conversationId changes
  useEffect(() => {
    const loadConversation = async () => {
      if (conversationId !== null && conversationId !== undefined) {
        try {
          const conv = await window.electronAPI.getConversation(conversationId);
          if (conv) {
            setMessages(conv.messages);
            setCurrentConversationId(conv.id);
            setActiveConversationTitle(conv.title);
          } else {
            // Conversation not found, clear messages
            setMessages([]);
            setCurrentConversationId(null);
            setActiveConversationTitle(null);
          }
        } catch (error) {
          console.error('Failed to load conversation:', error);
          setMessages([]);
          setCurrentConversationId(null);
          setActiveConversationTitle(null);
        }
      } else {
        // No conversationId provided - clear messages
        setMessages([]);
        setCurrentConversationId(null);
        setActiveConversationTitle(null);
      }
    };
    loadConversation();
  }, [conversationId]);

  // Auto-save conversation with debouncing
  const saveConversation = useCallback(async (conversationMessages: Message[], conversationTitle?: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        let convId = currentConversationId;
        let title = conversationTitle;

        if (!convId) {
          // Create new conversation if none exists
          title = title || conversationMessages[0]?.content.substring(0, 50) || 'New Conversation';
          const newConv = await window.electronAPI.createConversation(title);
          convId = newConv.id;
          setCurrentConversationId(convId);
          setActiveConversationTitle(newConv.title);
          if (onConversationChange) {
            onConversationChange(convId);
          }
        }

        const conv: Conversation = {
          id: convId!,
          title: title || 'New Conversation',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: conversationMessages,
        };

        // Update title if this is the first user message
        if (conversationMessages.length > 0 && conversationMessages[0].role === 'user' && !title) {
          conv.title = conversationMessages[0].content.substring(0, 50);
        }

        await window.electronAPI.saveConversation(conv);
        setActiveConversationTitle(conv.title);
      } catch (error) {
        console.error('Failed to save conversation:', error);
      }
    }, 500); // 500ms debounce
  }, [currentConversationId, onConversationChange]);

  const handleSend = async (content: string) => {
    const providerConfig = settings.providers?.[settings.provider];
    const hasValidConfig = providerConfig && (
      settings.provider === 'ollama' ? true : 'apiKey' in providerConfig && !!providerConfig.apiKey
    );
    if (!content.trim() || !hasValidConfig || !settings.logseqPath) {
      return;
    }

    const userMessage: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Get context settings with defaults
      const contextSettings = settings.contextSettings || getDefaultContextSettings();
      const maxPages = contextSettings.maxPages || 5;
      const maxBlocksPerPage = contextSettings.maxBlocksPerPage || 50;
      const maxTotalBlocks = contextSettings.maxTotalBlocks || 100;
      const includeBlocks = contextSettings.includeBlocks || 'all';
      
      let context: Array<{ pageName: string; excerpt: string; filePath?: string; blocks: Array<{ content: string; id?: string }> }> = [];
      let totalBlocksCount = 0;
      
      // Helper to add a page to context with limits and filtering
      const addPageToContext = (page: { pageName: string; path: string; blocks: Array<{ content: string; id?: string; level: number }> }) => {
        // Check if we've reached max pages
        if (context.length >= maxPages) {
          console.log('[ChatInterface] Max pages reached, skipping:', page.pageName);
          return false;
        }
        
        // Check namespace exclusion
        if (shouldExcludePage(page.pageName, contextSettings.excludeNamespaces)) {
          console.log('[ChatInterface] Page excluded by namespace:', page.pageName);
          return false;
        }
        
        // Check date range for journals
        if (page.pageName.startsWith('journals/') && !isJournalInRange(page.pageName, contextSettings.dateRangeDays)) {
          console.log('[ChatInterface] Journal excluded by date range:', page.pageName);
          return false;
        }
        
        // Filter blocks based on mode
        const filteredBlocks = filterBlocks(page.blocks, content, includeBlocks, maxBlocksPerPage);
        
        // Check if adding these blocks would exceed max total
        const blocksToAdd = Math.min(filteredBlocks.length, maxTotalBlocks - totalBlocksCount);
        if (blocksToAdd <= 0) {
          console.log('[ChatInterface] Max total blocks reached, skipping:', page.pageName);
          return false;
        }
        
        const finalBlocks = filteredBlocks.slice(0, blocksToAdd).map(b => ({
          content: b.content,
          id: b.id,
          level: b.level,
        }));
        
        context.push({
          pageName: page.pageName,
          excerpt: formatBlocksAsMarkdown(page.blocks) || '',
          filePath: page.path,
          blocks: finalBlocks,
        });
        
        totalBlocksCount += finalBlocks.length;
        console.log('[ChatInterface] Added page to context:', page.pageName, 'blocks:', finalBlocks.length, 'total blocks:', totalBlocksCount);
        return true;
      };
      
      // Check conversation history for page/journal references mentioned by AI
      const allMessages = [...messages, { role: 'user' as const, content }];
      const journalRefPattern = /\[\[journals\/(\d{4}_\d{2}_\d{2})\]\]|journals\/(\d{4}_\d{2}_\d{2})/gi;
      const pageRefPattern = /\[\[([^\]]+)\]\]/g;
      
      // Extract all page/journal references from conversation
      const mentionedJournals = new Set<string>();
      const mentionedPages = new Set<string>();
      
      for (const msg of allMessages) {
        // Extract journal references (e.g., [[journals/2025_10_29]])
        const journalMatches = msg.content.matchAll(journalRefPattern);
        for (const match of journalMatches) {
          const journalName = `journals/${match[1] || match[2]}`;
          mentionedJournals.add(journalName);
        }
        
        // Extract page references (e.g., [[Page Name]])
        const pageMatches = msg.content.matchAll(pageRefPattern);
        for (const match of pageMatches) {
          mentionedPages.add(match[1]);
        }
      }
      
      // Detect queries asking about content - be more aggressive
      const askingAboutContent = /what'?s?\s+in|contents?|show.*content|tell.*what's|what does.*say|what does.*contain|what.*file|what.*entry/i.test(content);
      const mentionsJournal = /journal/i.test(content);
      const mentionsFile = /file|entry/i.test(content);
      const referringToPrevious = /that|it|this/i.test(content);
      
      // Query journals mentioned in conversation or detected in current query
      const datePattern = /(\d{4}-\d{2}-\d{2})/g;
      const dateMatches = content.match(datePattern);
      const mentionsToday = /today'?s?\s+journal|journal\s+for\s+today|journal\s+today|today.*journal/i.test(content);
      
      // If user is asking about journal content (even if just "what's in that file" after AI mentioned journal)
      const shouldQueryJournal = (askingAboutContent && mentionsJournal) || 
                                 (askingAboutContent && mentionsFile && referringToPrevious && mentionedJournals.size > 0) ||
                                 mentionsToday || 
                                 dateMatches ||
                                 (askingAboutContent && referringToPrevious && mentionedJournals.size > 0);
      
      if (shouldQueryJournal && context.length < maxPages) {
        let journalDate = todayStr;
        if (dateMatches && dateMatches[0]) {
          journalDate = dateMatches[0];
        } else if (mentionedJournals.size > 0) {
          // Use most recently mentioned journal
          const lastJournal = Array.from(mentionedJournals)[mentionedJournals.size - 1];
          const dateMatch = lastJournal.match(/(\d{4})_(\d{2})_(\d{2})/);
          if (dateMatch) {
            journalDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
          }
        }
        
        const journalName = `journals/${journalDate.replace(/-/g, '_')}`;
        console.log('[ChatInterface] Querying journal:', journalName);
        const journal = await window.electronAPI.getPage(journalName);
        if (journal) {
          addPageToContext(journal);
        } else {
          console.log('[ChatInterface] Journal NOT found:', journalName);
        }
      }
      
      // Query journals mentioned in previous messages
      for (const journalName of mentionedJournals) {
        if (context.length >= maxPages || totalBlocksCount >= maxTotalBlocks) break;
        if (!context.find(c => c.pageName === journalName)) {
          console.log('[ChatInterface] Querying mentioned journal:', journalName);
          const journal = await window.electronAPI.getPage(journalName);
          if (journal) {
            addPageToContext(journal);
          } else {
            console.log('[ChatInterface] Mentioned journal NOT found:', journalName);
          }
        }
      }
      
      // Query pages mentioned in conversation
      for (const pageName of mentionedPages) {
        if (context.length >= maxPages || totalBlocksCount >= maxTotalBlocks) break;
        // Skip if already in context or if it's a journal (handled above)
        if (!context.find(c => c.pageName === pageName) && !pageName.startsWith('journals/')) {
          // Query if asking about content OR if it's a journal reference we need to handle
          if (askingAboutContent || referringToPrevious) {
            const page = await window.electronAPI.getPage(pageName);
            if (page) {
              addPageToContext(page);
            }
          }
        }
      }
      
      // If asking about "that file" or "it" and we have a journal in context, make sure we have it
      if (askingAboutContent && referringToPrevious && context.length === 0 && mentionedJournals.size > 0 && context.length < maxPages) {
        const lastJournal = Array.from(mentionedJournals)[mentionedJournals.size - 1];
        const journal = await window.electronAPI.getPage(lastJournal);
        if (journal) {
          addPageToContext(journal);
        }
      }
      
      // Also check for "the X page" pattern
      const pageRefPattern2 = /the\s+([A-Z][a-zA-Z\s]+?)\s+page/i;
      const pageMatch = content.match(pageRefPattern2);
      if (pageMatch && context.length < maxPages && totalBlocksCount < maxTotalBlocks) {
        if (!context.find(c => c.pageName.includes(pageMatch[1]))) {
          const pageName = pageMatch[1];
          const page = await window.electronAPI.getPage(pageName);
          if (page) {
            addPageToContext(page);
          }
        }
      }
      
      // Detect traversal-related queries and include traversal results
      const connectedPagesPattern = /(?:show|list|find|get|what).*pages?\s+(?:connected|linked|related)\s+(?:to|with|from)\s+([A-Z][a-zA-Z\s]+?)(?:\s|$|\.|\?)/i;
      const relatedPagesPattern = /(?:find|show|list|get).*related\s+pages?\s+(?:about|for|on)\s+([A-Z][a-zA-Z\s]+?)(?:\s|$|\.|\?)/i;
      const orphanedPagesPattern = /(?:show|list|find|get).*orphaned\s+pages?/i;
      const traversePattern = /(?:traverse|explore).*graph.*(?:from|starting|at)\s+([A-Z][a-zA-Z\s]+?)(?:\s|$|\.|\?)/i;
      
      const connectedMatch = content.match(connectedPagesPattern);
      const relatedMatch = content.match(relatedPagesPattern);
      const orphanedMatch = content.match(orphanedPagesPattern);
      const traverseMatch = content.match(traversePattern);
      
      if (connectedMatch && connectedMatch[1]) {
        const pageName = connectedMatch[1].trim();
        console.log('[ChatInterface] Detected connected pages query for:', pageName);
        try {
          const connectedPages = await window.electronAPI.getConnectedPages(pageName);
          console.log('[ChatInterface] Found', connectedPages.length, 'connected pages');
          for (const connectedPage of connectedPages) {
            if (context.length >= maxPages || totalBlocksCount >= maxTotalBlocks) break;
            if (!context.find(c => c.pageName === connectedPage)) {
              const page = await window.electronAPI.getPage(connectedPage);
              if (page) {
                addPageToContext(page);
              }
            }
          }
        } catch (error) {
          console.error('[ChatInterface] Error getting connected pages:', error);
        }
      }
      
      if (relatedMatch && relatedMatch[1]) {
        const pageName = relatedMatch[1].trim();
        console.log('[ChatInterface] Detected related pages query for:', pageName);
        try {
          const relatedPages = await window.electronAPI.findRelatedPages(pageName, { maxHops: 2 });
          console.log('[ChatInterface] Found', relatedPages.length, 'related pages');
          // Limit to top 5 related pages
          for (const relatedPage of relatedPages.slice(0, 5)) {
            if (context.length >= maxPages || totalBlocksCount >= maxTotalBlocks) break;
            if (!context.find(c => c.pageName === relatedPage.pageName)) {
              const page = await window.electronAPI.getPage(relatedPage.pageName);
              if (page) {
                addPageToContext(page);
              }
            }
          }
        } catch (error) {
          console.error('[ChatInterface] Error finding related pages:', error);
        }
      }
      
      if (orphanedMatch) {
        console.log('[ChatInterface] Detected orphaned pages query');
        try {
          const orphanedPages = await window.electronAPI.findOrphanedPages({ includeTagged: false });
          console.log('[ChatInterface] Found', orphanedPages.length, 'orphaned pages');
          // Limit to top 10 orphaned pages
          for (const orphanedPage of orphanedPages.slice(0, 10)) {
            if (context.length >= maxPages || totalBlocksCount >= maxTotalBlocks) break;
            if (!context.find(c => c.pageName === orphanedPage.pageName)) {
              const page = await window.electronAPI.getPage(orphanedPage.pageName);
              if (page) {
                addPageToContext(page);
              }
            }
          }
        } catch (error) {
          console.error('[ChatInterface] Error finding orphaned pages:', error);
        }
      }
      
      if (traverseMatch && traverseMatch[1]) {
        const pageName = traverseMatch[1].trim();
        console.log('[ChatInterface] Detected graph traversal query for:', pageName);
        try {
          const traversalResults = await window.electronAPI.traverseGraph(pageName, 3);
          console.log('[ChatInterface] Found', traversalResults.length, 'pages in traversal');
          // Group by hop level and limit to top results per level
          const byHopLevel = new Map<number, string[]>();
          for (const result of traversalResults) {
            if (!byHopLevel.has(result.hopLevel)) {
              byHopLevel.set(result.hopLevel, []);
            }
            byHopLevel.get(result.hopLevel)!.push(result.pageName);
          }
          // Add pages from each hop level, limiting to 5 per level
          for (const [, pages] of byHopLevel.entries()) {
            for (const pageName of pages.slice(0, 5)) {
              if (context.length >= maxPages || totalBlocksCount >= maxTotalBlocks) break;
              if (!context.find(c => c.pageName === pageName)) {
                const page = await window.electronAPI.getPage(pageName);
                if (page) {
                  addPageToContext(page);
                }
              }
            }
          }
        } catch (error) {
          console.error('[ChatInterface] Error traversing graph:', error);
        }
      }
      
      // Also perform search for general context
      const searchResults = await window.electronAPI.search(content);
      // For search results, we need to get the actual page to get the file path
      for (const result of searchResults) {
        if (context.length >= maxPages || totalBlocksCount >= maxTotalBlocks) break;
        if (context.find(c => c.pageName === result.pageName)) continue;
        
        // Check namespace exclusion
        if (shouldExcludePage(result.pageName, contextSettings.excludeNamespaces)) {
          console.log('[ChatInterface] Search result excluded by namespace:', result.pageName);
          continue;
        }
        
        // Check date range for journals
        if (result.pageName.startsWith('journals/') && !isJournalInRange(result.pageName, contextSettings.dateRangeDays)) {
          console.log('[ChatInterface] Search result journal excluded by date range:', result.pageName);
          continue;
        }
        
        // Try to get full page data to get file path and full blocks
        const pageData = await window.electronAPI.getPage(result.pageName);
        if (pageData) {
          addPageToContext(pageData);
        } else {
          // Fallback to search result blocks if full page not available
          const filteredBlocks = filterBlocks(
            result.blocks.map(b => ({ ...b, level: 0 })),
            content,
            includeBlocks,
            maxBlocksPerPage
          );
          const blocksToAdd = Math.min(filteredBlocks.length, maxTotalBlocks - totalBlocksCount);
          if (blocksToAdd > 0 && context.length < maxPages) {
            const finalBlocks = filteredBlocks.slice(0, blocksToAdd).map(b => ({
              content: b.content,
              id: b.id,
            }));
            context.push({
              pageName: result.pageName,
              excerpt: result.excerpt,
              blocks: finalBlocks,
            });
            totalBlocksCount += finalBlocks.length;
            console.log('[ChatInterface] Added search result to context:', result.pageName, 'blocks:', finalBlocks.length);
          }
        }
      }
      
      console.log('[ChatInterface] Final context being sent to LLM:', context.length, 'items,', totalBlocksCount, 'total blocks');
      console.log('[ChatInterface] Limits: maxPages=', maxPages, 'maxTotalBlocks=', maxTotalBlocks, 'maxBlocksPerPage=', maxBlocksPerPage);
      context.forEach((ctx, idx) => {
        console.log(`[ChatInterface] Context ${idx}:`, ctx.pageName, 'blocks:', ctx.blocks?.length || 0);
      });

      const noContextWarning = !context || context.length === 0;

      // Helper function for executing actions
      const executeAction = async (action: { type?: 'create_journal' | 'create_page' | 'append_to_page'; action?: string; date?: string; pageName?: string; content: string }, noContextWarning: boolean) => {
        if (!action.type) return;

        try {
          const actionKey = `${action.type}|${action.pageName || ''}|${action.date || ''}|${(action.content || '').trim()}`;
          if (lastActionKeyRef.current === actionKey) {
            console.log('[ChatInterface] Skipping duplicate action execution:', actionKey);
            return;
          }

          // Policy: if no Logseq context, do not update existing files; only allow creating pages with explicit approval.
          if (noContextWarning) {
            if (action.type === 'create_page' && action.pageName) {
              const ok = window.confirm(`No Logseq context detected. Create new page "${action.pageName}"?`);
              if (!ok) {
                console.log('[ChatInterface] User declined create_page without context');
                return;
              }
            } else {
              console.log('[ChatInterface] Blocking file update without context. Action:', action.type);
              // Check if we've already shown this warning in the last message
              setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                const warningText = 'ℹ️ No Logseq context available — not updating existing files. Please reference a page/journal or rebuild the index. You may create a new page instead.';
                if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content.includes(warningText)) {
                  // Already shown, don't add again
                  return prev;
                }
                return [
                  ...prev,
                  { role: 'assistant', content: warningText }
                ];
              });
              return;
            }
          }

          if (action.type === 'create_journal' && action.date) {
            console.log('[ChatInterface] Executing create_journal for date:', action.date, 'content length:', action.content?.length || 0);
            await window.electronAPI.createJournalEntry(action.date, action.content);
            lastActionKeyRef.current = actionKey;
          } else if (action.type === 'create_page' && action.pageName) {
            console.log('[ChatInterface] Executing create_page for:', action.pageName, 'content length:', action.content?.length || 0);
            await window.electronAPI.createPage(action.pageName, action.content);
            lastActionKeyRef.current = actionKey;
          } else if (action.type === 'append_to_page' && action.pageName) {
            console.log('[ChatInterface] Executing append_to_page for:', action.pageName, 'content length:', action.content?.length || 0);
            await window.electronAPI.appendToPage(action.pageName, action.content);
            lastActionKeyRef.current = actionKey;
          }
        } catch (error) {
          console.error('Failed to execute file operation:', error);
          // Add error message
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ]);
        }
      };

      // Create placeholder assistant message for streaming
      const initialAssistantMessage: Message = {
        role: 'assistant',
        content: '',
        citations: context.map((c: { pageName: string; excerpt: string; filePath?: string }) => ({
          pageName: c.pageName,
          excerpt: c.excerpt,
          filePath: c.filePath,
        })),
        noContextWarning,
      };
      setMessages((prev) => [...prev, initialAssistantMessage]);
      setIsStreaming(true);
      setStreamingContent('');

      // Helper function to strip LOGSEQ_ACTION tags from content
      const stripActionTags = (content: string): string => {
        return content.replace(/<LOGSEQ_ACTION>[\s\S]*?<\/LOGSEQ_ACTION>/g, '').trim();
      };

      // Use streaming API
      window.electronAPI.chatStream(
        [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content },
        ],
        context,
        {
          onToken: (token: string) => {
            setStreamingContent((prev) => {
              const newContent = prev + token;
              // Strip LOGSEQ_ACTION tags from streaming content
              const cleanedContent = stripActionTags(newContent);
              // Update the last message with streaming content (without action tags)
              setMessages((prevMsgs) => {
                const updated = [...prevMsgs];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                  lastMsg.content = cleanedContent;
                }
                return updated;
              });
              return newContent;
            });
          },
          onComplete: (fullContent: string) => {
            setIsStreaming(false);
            setStreamingContent('');

            // Parse response for LOGSEQ_ACTION commands (robust parsing)
            // Find all LOGSEQ_ACTION tags (multiple actions may be present)
            const tagMatches = Array.from(fullContent.matchAll(/<LOGSEQ_ACTION>([\s\S]*?)<\/LOGSEQ_ACTION>/g));
            const fencedMatch = fullContent.match(/```(?:json|JSON)?[\r\n]+([\s\S]*?)```/);
            const jsonLikeMatch = fullContent.match(/\{[\s\S]*\}/);

            const tryParse = (raw: string | undefined) => {
              if (!raw) return undefined;
              try {
                return JSON.parse(raw.trim());
              } catch {
                return undefined;
              }
            };

            // Parse all LOGSEQ_ACTION tags
            const actions: Array<{ type?: 'create_journal' | 'create_page' | 'append_to_page'; action?: string; date?: string; pageName?: string; content: string }> = [];
            
            for (const match of tagMatches) {
              const parsed = tryParse(match[1]);
              if (parsed) {
                // Normalize possible 'action' property into 'type'
                if (!parsed.type && parsed.action) {
                  parsed.type = parsed.action as any;
                }
                if (parsed.type) {
                  actions.push(parsed);
                }
              }
            }
            
            // Fallback to fenced code block or JSON-like match if no tags found
            if (actions.length === 0) {
              const fallbackAction = tryParse(fencedMatch?.[1]) || tryParse(jsonLikeMatch?.[0]);
              if (fallbackAction) {
                if (!fallbackAction.type && fallbackAction.action) {
                  fallbackAction.type = fallbackAction.action as any;
                }
                if (fallbackAction.type) {
                  actions.push(fallbackAction);
                }
              }
            }
            
            // Always strip LOGSEQ_ACTION tags from display content
            const displayContent = stripActionTags(fullContent);

            // Don't infer actions - only execute when explicitly included in LOGSEQ_ACTION tag
            if (actions.length === 0) {
              console.log('[ChatInterface] No LOGSEQ_ACTION found - not executing any file operations.');
            }

            // Update the final message with parsed content (actions stored separately)
            setMessages((prevMsgs) => {
              const updated = [...prevMsgs];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.content = displayContent;
                // Store first action in message for backward compatibility (or remove if not needed)
                lastMsg.action = actions.length > 0 && actions[0].type ? {
                  type: actions[0].type,
                  date: actions[0].date,
                  pageName: actions[0].pageName,
                  content: actions[0].content,
                } : undefined;
              }
              return updated;
            });

            // Auto-execute all file operations sequentially
            if (actions.length > 0 && settings.logseqPath) {
              (async () => {
                const executedActions: Array<{ type: string; pageName?: string; date?: string; fileName: string }> = [];
                
                for (const action of actions) {
                  if (!action.type) continue;
                  
                  const actionKey = `${action.type}|${action.pageName || ''}|${action.date || ''}|${(action.content || '').trim()}`;
                  if (lastActionKeyRef.current === actionKey) {
                    console.log('[ChatInterface] Skipping duplicate action execution:', actionKey);
                    continue;
                  }

                  // Policy: if no Logseq context, do not update existing files; only allow creating pages with explicit approval.
                  if (noContextWarning) {
                    if (action.type === 'create_page' && action.pageName) {
                      const ok = window.confirm(`No Logseq context detected. Create new page "${action.pageName}"?`);
                      if (!ok) {
                        console.log('[ChatInterface] User declined create_page without context');
                        continue;
                      }
                    } else {
                      console.log('[ChatInterface] Blocking file update without context. Action:', action.type);
                      // Check if we've already shown this warning in the last message
                      setMessages((prev) => {
                        const lastMsg = prev[prev.length - 1];
                        const warningText = 'ℹ️ No Logseq context available — not updating existing files. Please reference a page/journal or rebuild the index. You may create a new page instead.';
                        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content.includes(warningText)) {
                          // Already shown, don't add again
                          return prev;
                        }
                        return [
                          ...prev,
                          { role: 'assistant', content: warningText }
                        ];
                      });
                      continue;
                    }
                  }

                  try {
                    // Execute action and get file path
                    let filePath: string | null = null;
                    if (action.type === 'create_journal' && action.date) {
                      console.log('[ChatInterface] Executing create_journal for date:', action.date, 'content length:', action.content?.length || 0);
                      filePath = await window.electronAPI.createJournalEntry(action.date, action.content);
                      const fileName = filePath.split('/').pop() || '';
                      executedActions.push({ type: 'create_journal', date: action.date, fileName });
                      lastActionKeyRef.current = actionKey;
                    } else if (action.type === 'create_page' && action.pageName) {
                      console.log('[ChatInterface] Executing create_page for:', action.pageName, 'content length:', action.content?.length || 0);
                      filePath = await window.electronAPI.createPage(action.pageName, action.content);
                      const fileName = filePath.split('/').pop() || '';
                      executedActions.push({ type: 'create_page', pageName: action.pageName, fileName });
                      lastActionKeyRef.current = actionKey;
                    } else if (action.type === 'append_to_page' && action.pageName) {
                      console.log('[ChatInterface] Executing append_to_page for:', action.pageName, 'content length:', action.content?.length || 0);
                      filePath = await window.electronAPI.appendToPage(action.pageName, action.content);
                      const fileName = filePath.split('/').pop() || '';
                      executedActions.push({ type: 'append_to_page', pageName: action.pageName, fileName });
                      lastActionKeyRef.current = actionKey;
                    }
                  } catch (err) {
                    console.error('Failed to execute action:', err);
                    // Add error message
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: 'assistant',
                        content: `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
                      },
                    ]);
                  }
                }
                
                // Update message with summary of all executed actions
                if (executedActions.length > 0) {
                  setMessages((prevMsgs) => {
                    const updated = [...prevMsgs];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg && lastMsg.role === 'assistant') {
                      // Remove any existing success markers
                      const contentWithoutMarkers = lastMsg.content
                        .replace(/\n\n✅ [^\n]+/g, '')
                        .replace(/✅ [^\n]+\n/g, '');
                      
                      // Build summary
                      const summaries: string[] = [];
                      const pagesCreated = executedActions.filter(a => a.type === 'create_page');
                      const journalsCreated = executedActions.filter(a => a.type === 'create_journal');
                      const pagesUpdated = executedActions.filter(a => a.type === 'append_to_page');
                      
                      if (pagesCreated.length > 0) {
                        if (pagesCreated.length === 1) {
                          summaries.push(`✅ Page saved to: ${pagesCreated[0].fileName}`);
                        } else {
                          summaries.push(`✅ Created ${pagesCreated.length} pages: ${pagesCreated.map(a => a.fileName).join(', ')}`);
                        }
                      }
                      
                      if (journalsCreated.length > 0) {
                        if (journalsCreated.length === 1) {
                          summaries.push(`✅ Journal entry saved to: ${journalsCreated[0].fileName}`);
                        } else {
                          summaries.push(`✅ Created ${journalsCreated.length} journal entries: ${journalsCreated.map(a => a.fileName).join(', ')}`);
                        }
                      }
                      
                      if (pagesUpdated.length > 0) {
                        if (pagesUpdated.length === 1) {
                          const location = pagesUpdated[0].pageName?.includes('journals') ? 'journal' : 'page';
                          summaries.push(`✅ Updated ${location}: ${pagesUpdated[0].fileName}`);
                        } else {
                          summaries.push(`✅ Updated ${pagesUpdated.length} pages: ${pagesUpdated.map(a => a.fileName).join(', ')}`);
                        }
                      }
                      
                      lastMsg.content = contentWithoutMarkers + (summaries.length > 0 ? '\n\n' + summaries.join('\n') : '');
                    }
                    return updated;
                  });
                }
              })().catch(err => {
                console.error('Error executing actions:', err);
              });
            }
            
            setLoading(false);
            
            // Auto-save conversation after response completes
            setMessages((prevMsgs) => {
              const finalMessages = [...prevMsgs];
              saveConversation(finalMessages).catch(err => {
                console.error('Failed to save conversation:', err);
              });
              return finalMessages;
            });
          },
          onError: (error: string) => {
            setIsStreaming(false);
            setStreamingContent('');
            setLoading(false);
            const errorMessage: Message = {
              role: 'assistant',
              content: `Error: ${error}`,
            };
            setMessages((prev) => [...prev, errorMessage]);
          },
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      setIsStreaming(false);
      setStreamingContent('');
      setLoading(false);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Cleanup save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Ensure index is built on mount (so search works without re-saving settings)
  useEffect(() => {
    window.electronAPI.rebuildIndex?.().catch(() => {});
  }, []);

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await window.electronAPI.updateConversationTitle(id, newTitle);
      setActiveConversationTitle(newTitle);
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    }
  };

  const isConfigValid = () => {
    const providerConfig = settings.providers?.[settings.provider];
    if (!providerConfig || !settings.logseqPath) return false;
    if (settings.provider === 'ollama') return true;
    return 'apiKey' in providerConfig && !!providerConfig.apiKey;
  };

  return (
    <div className="chat-interface">
      <Header 
        onOpenSidebar={onOpenSidebar} 
        onOpenConversations={onOpenConversations} 
        onToggleTheme={toggleTheme} 
        theme={theme}
        activeConversationTitle={activeConversationTitle}
        activeConversationId={currentConversationId}
        onRenameConversation={handleRenameConversation}
      />
      <MessageList messages={messages} loading={loading || isStreaming} endRef={messagesEndRef} />
      <MessageInput 
        onSend={handleSend} 
        disabled={loading || !isConfigValid()} 
      />
    </div>
  );
}

