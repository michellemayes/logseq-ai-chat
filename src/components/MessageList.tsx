import { Message } from './ChatInterface';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import './MessageList.css';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  endRef?: React.RefObject<HTMLDivElement>;
}

export default function MessageList({ messages, loading, endRef }: MessageListProps) {
  if (messages.length === 0 && !loading) {
    return (
      <div className="message-list empty">
        <p className="empty-message">Start a conversation about your Logseq notes</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message, idx) => (
        <MessageBubble key={idx} message={message} />
      ))}
      {loading && (
        <div className="message-bubble assistant">
          <div className="message-content">
            <TypingIndicator />
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

