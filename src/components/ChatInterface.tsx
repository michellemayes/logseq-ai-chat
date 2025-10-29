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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastActionKeyRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Load conversation on mount or when conversationId changes
  useEffect(() => {
    const loadConversation = async () => {
      if (conversationId) {
        try {
          const conv = await window.electronAPI.getConversation(conversationId);
          if (conv) {
            setMessages(conv.messages);
            setCurrentConversationId(conv.id);
          }
        } catch (error) {
          console.error('Failed to load conversation:', error);
        }
      } else {
        // Load last active conversation on mount
        try {
          const activeId = await window.electronAPI.getActiveConversationId();
          if (activeId) {
            const conv = await window.electronAPI.getConversation(activeId);
            if (conv) {
              setMessages(conv.messages);
              setCurrentConversationId(conv.id);
              if (onConversationChange) {
                onConversationChange(conv.id);
              }
            }
          }
        } catch (error) {
          console.error('Failed to load active conversation:', error);
        }
      }
    };
    loadConversation();
  }, [conversationId, onConversationChange]);

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
      } catch (error) {
        console.error('Failed to save conversation:', error);
      }
    }, 500); // 500ms debounce
  }, [currentConversationId, onConversationChange]);

  const handleSend = async (content: string) => {
    if (!content.trim() || !settings.apiKey || !settings.logseqPath) {
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
            const filePath = await window.electronAPI.createJournalEntry(action.date, action.content);
            // Update message with success indicator
            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                const marker = '✅ Journal entry saved to:';
                if (!lastMsg.content.includes(marker)) {
                  lastMsg.content += `\n\n${marker} ${filePath.split('/').pop()}`;
                }
              }
              return updated;
            });
            lastActionKeyRef.current = actionKey;
          } else if (action.type === 'create_page' && action.pageName) {
            console.log('[ChatInterface] Executing create_page for:', action.pageName, 'content length:', action.content?.length || 0);
            const filePath = await window.electronAPI.createPage(action.pageName, action.content);
            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                const marker = '✅ Page saved to:';
                if (!lastMsg.content.includes(marker)) {
                  lastMsg.content += `\n\n${marker} ${filePath.split('/').pop()}`;
                }
              }
              return updated;
            });
            lastActionKeyRef.current = actionKey;
          } else if (action.type === 'append_to_page' && action.pageName) {
            console.log('[ChatInterface] Executing append_to_page for:', action.pageName, 'content length:', action.content?.length || 0);
            const filePath = await window.electronAPI.appendToPage(action.pageName, action.content);
            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                const fileName = filePath.split('/').pop();
                const location = action.pageName?.includes('journals') ? 'journal' : 'page';
                const marker = `✅ Updated ${location}: ${fileName}`;
                if (!lastMsg.content.includes(marker)) {
                  lastMsg.content += `\n\n${marker}`;
                }
              }
              return updated;
            });
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
              // Update the last message with streaming content
              setMessages((prevMsgs) => {
                const updated = [...prevMsgs];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                  lastMsg.content = newContent;
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
            let action: { type?: 'create_journal' | 'create_page' | 'append_to_page'; action?: string; date?: string; pageName?: string; content: string } | undefined;
            let displayContent = fullContent;

            const tagMatch = fullContent.match(/<LOGSEQ_ACTION>([\s\S]*?)<\/LOGSEQ_ACTION>/);
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

            action = tryParse(tagMatch?.[1]) || tryParse(fencedMatch?.[1]) || tryParse(jsonLikeMatch?.[0]);
            // Normalize possible 'action' property into 'type'
            if (action && !action.type && action.action) {
              action.type = action.action as any;
            }
            if (action && tagMatch) {
              displayContent = fullContent.replace(/<LOGSEQ_ACTION>[\s\S]*?<\/LOGSEQ_ACTION>/, '').trim();
            }

            // Don't infer actions - only execute when explicitly included in LOGSEQ_ACTION tag
            if (!action) {
              console.log('[ChatInterface] No LOGSEQ_ACTION found - not executing any file operations.');
            }

            // Update the final message with parsed content and action
            setMessages((prevMsgs) => {
              const updated = [...prevMsgs];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.content = displayContent;
                lastMsg.action = action && action.type ? {
                  type: action.type,
                  date: action.date,
                  pageName: action.pageName,
                  content: action.content,
                } : undefined;
              }
              return updated;
            });

            // Auto-execute file operations
            if (action && settings.logseqPath) {
              executeAction(action, noContextWarning).catch(err => {
                console.error('Failed to execute action:', err);
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

  return (
    <div className="chat-interface">
      <Header onOpenSidebar={onOpenSidebar} onOpenConversations={onOpenConversations} onToggleTheme={toggleTheme} theme={theme} />
      <MessageList messages={messages} loading={loading || isStreaming} endRef={messagesEndRef} />
      <MessageInput onSend={handleSend} disabled={loading || !settings.apiKey || !settings.logseqPath} />
    </div>
  );
}

