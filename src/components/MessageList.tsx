import { Message } from './ChatInterface';
import MessageBubble from './MessageBubble';
import './MessageList.css';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
}

export default function MessageList({ messages, loading }: MessageListProps) {
  if (messages.length === 0 && !loading) {
    return (
      <div className="message-list empty">
        <p className="empty-message">Start a conversation about your LogSeq notes</p>
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
          <div className="message-content">Thinking...</div>
        </div>
      )}
    </div>
  );
}

