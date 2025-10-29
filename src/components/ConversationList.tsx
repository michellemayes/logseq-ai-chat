import { ConversationMetadata } from '../types';
import './ConversationList.css';

interface ConversationListProps {
  conversations: ConversationMetadata[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  searchQuery?: string;
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  searchQuery = '',
}: ConversationListProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = searchQuery
    ? conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessagePreview?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <button className="new-conversation-button" onClick={onNewConversation}>
          + New Conversation
        </button>
      </div>
      {filteredConversations.length === 0 ? (
        <div className="conversation-list-empty">
          {searchQuery ? 'No conversations found' : 'No conversations yet'}
        </div>
      ) : (
        <div className="conversation-items">
          {filteredConversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="conversation-item-header">
                <div className="conversation-title">{conv.title}</div>
                <button
                  className="conversation-delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete conversation "${conv.title}"?`)) {
                      onDeleteConversation(conv.id);
                    }
                  }}
                  aria-label="Delete conversation"
                >
                  ×
                </button>
              </div>
              {conv.lastMessagePreview && (
                <div className="conversation-preview">{conv.lastMessagePreview}</div>
              )}
              <div className="conversation-meta">
                <span>{formatDate(conv.updatedAt)}</span>
                <span>{conv.messageCount} messages</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

