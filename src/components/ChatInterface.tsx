import { useState, useRef, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import Header from './Header';
import './ChatInterface.css';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ pageName: string; excerpt: string }>;
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

  const handleSend = async (content: string) => {
    if (!content.trim() || !settings.apiKey || !settings.logseqPath) {
      return;
    }

    const userMessage: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const searchResults = await window.electronAPI.search(content);
      const context = searchResults.slice(0, 5).map((r: { pageName: string; excerpt: string; blocks: Array<{ content: string; id?: string }> }) => ({
        pageName: r.pageName,
        excerpt: r.excerpt,
        blocks: r.blocks,
      }));

      const response = await window.electronAPI.chat(
        [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content },
        ],
        context
      );

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
        citations: context.map((c: { pageName: string; excerpt: string }) => ({
          pageName: c.pageName,
          excerpt: c.excerpt,
        })),
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
      <MessageList messages={messages} loading={loading} />
      <div ref={messagesEndRef} />
      <MessageInput onSend={handleSend} disabled={loading || !settings.apiKey || !settings.logseqPath} />
    </div>
  );
}

