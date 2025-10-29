import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from './ChatInterface';
import './MessageBubble.css';
import { useRef, useState, useLayoutEffect } from 'react';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!tooltipVisible || !bubbleRef.current || !tooltipRef.current) return;
    const bubbleRect = bubbleRef.current.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;
    const width = tooltipEl.offsetWidth;
    const height = tooltipEl.offsetHeight;

    let left = bubbleRect.left + bubbleRect.width / 2 - width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

    let top = bubbleRect.top - height - 8;
    if (top < 8) {
      top = bubbleRect.bottom + 8;
    }

    setTooltipPos({ top, left });
  }, [tooltipVisible]);

  return (
    <div className={`message-bubble ${message.role}`}>
      {message.noContextWarning && (
        <div
          className="warning-bubble"
          aria-label="No LogSeq context"
          ref={bubbleRef}
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
        >
          !
          <div
            ref={tooltipRef}
            className={`warning-tooltip${tooltipVisible ? ' visible' : ''}`}
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
          >
            ℹ️ No LogSeq context was available for this query. Try specifying a page/journal or rebuild the index.
          </div>
        </div>
      )}
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
          {message.citations.map((citation: { pageName: string; excerpt: string; filePath?: string }, idx: number) => (
            <div key={idx} className="citation-card">
              <div 
                className={`citation-page ${citation.filePath ? 'citation-page-clickable' : ''}`}
                onClick={citation.filePath ? () => {
                  window.electronAPI.openFile(citation.filePath!);
                } : undefined}
                title={citation.filePath ? `Click to open: ${citation.filePath}` : undefined}
              >
                {citation.pageName}
              </div>
              <div className="citation-excerpt">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {citation.excerpt}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

