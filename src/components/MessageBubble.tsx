import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import './MessageBubble.css';
import { useRef, useState, useLayoutEffect, useCallback } from 'react';
import copyIcon from '../../svg_assets/copy-document-svgrepo-com.svg';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [blockHoverId, setBlockHoverId] = useState<string | null>(null);
  const [blockPreview, setBlockPreview] = useState<string | null>(null);
  const [citationsExpanded, setCitationsExpanded] = useState(false);
  const [copyLabel, setCopyLabel] = useState<'Copy' | 'Copied!'>('Copy');

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

  const handleBlockReferenceClick = useCallback(async (blockId: string) => {
    try {
      const blockWithPage = await window.electronAPI.getBlockById(blockId);
      if (blockWithPage) {
        // Open the parent page file
        await window.electronAPI.openFile(blockWithPage.parentPage.path);
        // TODO: Add block highlighting/navigation animation
      } else {
        console.error('Block not found:', blockId);
        // Could show error message to user
      }
    } catch (error) {
      console.error('Failed to navigate to block:', error);
    }
  }, []);

  const handleBlockReferenceHover = useCallback(async (blockId: string) => {
    setBlockHoverId(blockId);
    try {
      const blockWithPage = await window.electronAPI.getBlockById(blockId);
      if (blockWithPage) {
        setBlockPreview(blockWithPage.block.content.substring(0, 200));
      } else {
        setBlockPreview(null);
      }
    } catch (error) {
      setBlockPreview(null);
    }
  }, []);

  const handleBlockReferenceLeave = useCallback(() => {
    setBlockHoverId(null);
    setBlockPreview(null);
  }, []);

  // Process content to replace block references with markdown links
  const processedContent = message.role === 'assistant' && message.content
    ? message.content.replace(/\(\(([^)]+)\)\)/g, (match, blockId) => {
        return `[${match}](block://${blockId})`; // Use custom protocol to identify block references
      })
    : message.content;

  const handleCopy = useCallback(async () => {
    try {
      const textToCopy = processedContent || '';
      await navigator.clipboard.writeText(textToCopy);
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy'), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [processedContent]);

  return (
    <div className={`message-bubble ${message.role}`}>
      {message.role === 'assistant' && (
        <button
          className="copy-button"
          onClick={handleCopy}
          aria-label="Copy message"
          title={copyLabel}
        >
          {copyLabel === 'Copy' ? (
            <img src={copyIcon} alt="Copy" />
          ) : '✓'}
        </button>
      )}
      {message.noContextWarning && (
        <div
          className="warning-bubble"
          aria-label="No Logseq context"
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
            ℹ️ No Logseq context was available for this query. Try specifying a page/journal or rebuild the index.
          </div>
        </div>
      )}
      <div className="message-content">
        {message.role === 'assistant' ? (
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children, ...props }) => {
                // Check if this is a block reference (custom protocol)
                if (href && href.startsWith('block://')) {
                  const blockId = href.replace('block://', '');
                  return (
                    <span
                      className="block-reference"
                      onClick={() => handleBlockReferenceClick(blockId)}
                      onMouseEnter={() => handleBlockReferenceHover(blockId)}
                      onMouseLeave={handleBlockReferenceLeave}
                      title={blockPreview && blockHoverId === blockId ? blockPreview : undefined}
                    >
                      {children}
                    </span>
                  );
                }
                // Regular link
                return <a href={href} {...props}>{children}</a>;
              },
            }}
          >
            {processedContent}
          </ReactMarkdown>
        ) : (
          message.content
        )}
      </div>
      {message.citations && message.citations.length > 0 && (
        <div className="citations">
          <div 
            className="citations-header citations-header-clickable"
            onClick={() => setCitationsExpanded(!citationsExpanded)}
          >
            <span className="citations-toggle">{citationsExpanded ? '▼' : '▶'}</span>
            Sources ({message.citations.length}):
          </div>
          {citationsExpanded && (
            <div className="citations-content">
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
      )}
    </div>
  );
}

