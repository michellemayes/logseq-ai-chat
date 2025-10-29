import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from './ChatInterface';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={`message-bubble ${message.role}`}>
      <div className="message-content">
        {message.role === 'assistant' ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        ) : (
          message.content
        )}
      </div>
      {message.citations && message.citations.length > 0 && (
        <div className="citations">
          <div className="citations-header">Sources:</div>
          {message.citations.map((citation: { pageName: string; excerpt: string }, idx: number) => (
            <div key={idx} className="citation-card">
              <div className="citation-page">{citation.pageName}</div>
              <div className="citation-excerpt">{citation.excerpt}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

