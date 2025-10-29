import { useState, useRef, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { SearchResult } from '../types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import Header from './Header';
import './ChatInterface.css';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ pageName: string; excerpt: string; filePath?: string }>;
  noContextWarning?: boolean;
  action?: {
    type: 'create_journal' | 'create_page' | 'append_to_page';
    date?: string;
    pageName?: string;
    content: string;
  };
}

interface ChatInterfaceProps {
  onOpenSidebar: () => void;
}

export default function ChatInterface({ onOpenSidebar }: ChatInterfaceProps) {
  const { settings } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ensure index is built on mount (so search works without re-saving settings)
  useEffect(() => {
    window.electronAPI.rebuildIndex?.().catch(() => {});
  }, []);

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
      
      let context: Array<{ pageName: string; excerpt: string; filePath?: string; blocks: Array<{ content: string; id?: string }> }> = [];
      
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
      
      if (shouldQueryJournal) {
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
          console.log('[ChatInterface] Journal found:', journal.pageName, 'Blocks:', journal.blocks.length);
          console.log('[ChatInterface] Journal blocks content:', journal.blocks.map(b => b.content));
          const blocks = journal.blocks.map(b => ({
            content: b.content,
            id: b.id,
          }));
          context.push({
            pageName: journal.pageName,
            excerpt: journal.blocks.map(b => b.content).join('\n').substring(0, 500) || '',
            filePath: journal.path,
            blocks: blocks,
          });
          console.log('[ChatInterface] Added journal to context:', journal.pageName, 'with', blocks.length, 'blocks');
        } else {
          console.log('[ChatInterface] Journal NOT found:', journalName);
        }
      }
      
      // Query journals mentioned in previous messages
      for (const journalName of mentionedJournals) {
        if (!context.find(c => c.pageName === journalName)) {
          console.log('[ChatInterface] Querying mentioned journal:', journalName);
          const journal = await window.electronAPI.getPage(journalName);
          if (journal) {
            console.log('[ChatInterface] Mentioned journal found:', journal.pageName, 'Blocks:', journal.blocks.length);
            console.log('[ChatInterface] Mentioned journal blocks:', journal.blocks.map(b => b.content));
            const blocks = journal.blocks.map(b => ({
              content: b.content,
              id: b.id,
            }));
            context.push({
              pageName: journal.pageName,
              excerpt: journal.blocks.map(b => b.content).join('\n').substring(0, 500) || '',
              filePath: journal.path,
              blocks: blocks,
            });
            console.log('[ChatInterface] Added mentioned journal to context');
          } else {
            console.log('[ChatInterface] Mentioned journal NOT found:', journalName);
          }
        }
      }
      
      // Query pages mentioned in conversation
      for (const pageName of mentionedPages) {
        // Skip if already in context or if it's a journal (handled above)
        if (!context.find(c => c.pageName === pageName) && !pageName.startsWith('journals/')) {
          // Query if asking about content OR if it's a journal reference we need to handle
          if (askingAboutContent || referringToPrevious) {
            const page = await window.electronAPI.getPage(pageName);
            if (page) {
              const blocks = page.blocks.map(b => ({
                content: b.content,
                id: b.id,
              }));
              context.push({
                pageName: page.pageName,
                excerpt: page.blocks.map(b => b.content).join('\n').substring(0, 500) || '',
                filePath: page.path,
                blocks: blocks,
              });
            }
          }
        }
      }
      
      // If asking about "that file" or "it" and we have a journal in context, make sure we have it
      if (askingAboutContent && referringToPrevious && context.length === 0 && mentionedJournals.size > 0) {
        const lastJournal = Array.from(mentionedJournals)[mentionedJournals.size - 1];
        const journal = await window.electronAPI.getPage(lastJournal);
        if (journal) {
          const blocks = journal.blocks.map(b => ({
            content: b.content,
            id: b.id,
          }));
          context.push({
            pageName: journal.pageName,
            excerpt: journal.blocks.map(b => b.content).join('\n').substring(0, 500) || '',
            filePath: journal.path,
            blocks: blocks,
          });
        }
      }
      
      // Also check for "the X page" pattern
      const pageRefPattern2 = /the\s+([A-Z][a-zA-Z\s]+?)\s+page/i;
      const pageMatch = content.match(pageRefPattern2);
      if (pageMatch && !context.find(c => c.pageName.includes(pageMatch[1]))) {
        const pageName = pageMatch[1];
        const page = await window.electronAPI.getPage(pageName);
        if (page) {
          const blocks = page.blocks.map(b => ({
            content: b.content,
            id: b.id,
          }));
          context.push({
            pageName: page.pageName,
            excerpt: page.blocks.map(b => b.content).join('\n').substring(0, 500) || '',
            filePath: page.path,
            blocks: blocks,
          });
        }
      }
      
      // Also perform search for general context
      const searchResults = await window.electronAPI.search(content);
      // For search results, we need to get the actual page to get the file path
      const searchContext = await Promise.all(
        searchResults.slice(0, 5).map(async (r: SearchResult) => {
          // Try to get full page data to get file path
          const pageData = await window.electronAPI.getPage(r.pageName);
          return {
            pageName: r.pageName,
            excerpt: r.excerpt,
            filePath: pageData?.path,
            blocks: r.blocks,
          };
        })
      );
      
      // Combine graph query results with search results, prioritizing graph queries
      context = [...context, ...searchContext.filter(sc => !context.find(c => c.pageName === sc.pageName))];
      
      console.log('[ChatInterface] Final context being sent to LLM:', context.length, 'items');
      context.forEach((ctx, idx) => {
        console.log(`[ChatInterface] Context ${idx}:`, ctx.pageName, 'blocks:', ctx.blocks?.length || 0);
        if (ctx.blocks && ctx.blocks.length > 0) {
          console.log(`[ChatInterface] Context ${idx} block contents:`, ctx.blocks.map(b => b.content.substring(0, 50) + '...'));
        }
      });

      const response = await window.electronAPI.chat(
        [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content },
        ],
        context
      );

      const noContextWarning = !context || context.length === 0;

      // Parse response for LOGSEQ_ACTION commands
      const actionMatch = response.match(/<LOGSEQ_ACTION>([\s\S]*?)<\/LOGSEQ_ACTION>/);
      let action = undefined;
      let displayContent = response;

      if (actionMatch) {
        try {
          action = JSON.parse(actionMatch[1]);
          displayContent = response.replace(/<LOGSEQ_ACTION>[\s\S]*?<\/LOGSEQ_ACTION>/, '').trim();
        } catch (e) {
          console.error('Failed to parse action:', e);
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: displayContent,
        citations: context.map((c: { pageName: string; excerpt: string; filePath?: string }) => ({
          pageName: c.pageName,
          excerpt: c.excerpt,
          filePath: c.filePath,
        })),
        noContextWarning,
        action,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-execute file operations
      if (action && settings.logseqPath) {
        try {
          if (action.type === 'create_journal' && action.date) {
            const filePath = await window.electronAPI.createJournalEntry(action.date, action.content);
            // Update message with success indicator
            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.content += `\n\n✅ Journal entry saved to: ${filePath.split('/').pop()}`;
              }
              return updated;
            });
          } else if (action.type === 'create_page' && action.pageName) {
            const filePath = await window.electronAPI.createPage(action.pageName, action.content);
            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.content += `\n\n✅ Page saved to: ${filePath.split('/').pop()}`;
              }
              return updated;
            });
          } else if (action.type === 'append_to_page' && action.pageName) {
            const filePath = await window.electronAPI.appendToPage(action.pageName, action.content);
            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                const fileName = filePath.split('/').pop();
                const location = action.pageName?.includes('journals') ? 'journal' : 'page';
                lastMsg.content += `\n\n✅ Updated ${location}: ${fileName}`;
              }
              return updated;
            });
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
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <Header onOpenSidebar={onOpenSidebar} onToggleTheme={toggleTheme} theme={theme} />
      <MessageList messages={messages} loading={loading} endRef={messagesEndRef} />
      <MessageInput onSend={handleSend} disabled={loading || !settings.apiKey || !settings.logseqPath} />
    </div>
  );
}

