import { useState, useEffect } from 'react';
import ConversationList from './ConversationList';
import { ConversationMetadata } from '../types';
import './ConversationsPanel.css';

interface ConversationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation?: (id: string) => void;
}

export default function ConversationsPanel({ isOpen, onClose, onSelectConversation }: ConversationsPanelProps) {
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      loadActiveConversation();
      // Clear search when opening panel
      setSearchQuery('');
    }
  }, [isOpen]);

  const loadConversations = async () => {
    try {
      const convs = await window.electronAPI.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadActiveConversation = async () => {
    try {
      const id = await window.electronAPI.getActiveConversationId();
      setActiveConversationId(id);
    } catch (error) {
      console.error('Failed to load active conversation:', error);
    }
  };

  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id);
    await window.electronAPI.setActiveConversationId(id);
    if (onSelectConversation) {
      onSelectConversation(id);
    }
    onClose();
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await window.electronAPI.deleteConversation(id);
      await loadConversations();
      // If there's a search query, re-apply it
      if (searchQuery.trim()) {
        await handleSearch(searchQuery);
      }
      if (activeConversationId === id) {
        setActiveConversationId(null);
        await window.electronAPI.setActiveConversationId(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert(`Failed to delete conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleNewConversation = async () => {
    try {
      // Clear search query when creating new conversation
      setSearchQuery('');
      const conv = await window.electronAPI.createConversation('New Conversation');
      await loadConversations();
      await handleSelectConversation(conv.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert(`Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await window.electronAPI.searchConversations(query);
        setConversations(results);
      } catch (error) {
        console.error('Failed to search conversations:', error);
      }
    } else {
      await loadConversations();
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await window.electronAPI.updateConversationTitle(id, newTitle);
      await loadConversations();
      // If there's a search query, re-apply it
      if (searchQuery.trim()) {
        await handleSearch(searchQuery);
      }
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      alert(`Failed to rename conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <>
      {isOpen && <div className="conversations-overlay" onClick={onClose} />}
      <div className={`conversations-panel ${isOpen ? 'open' : ''}`}>
        <div className="conversations-panel-header">
          <h2>Conversations</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="conversations-panel-content">
          <div className="conversation-search">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="conversation-search-input"
            />
          </div>
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onNewConversation={handleNewConversation}
            onRenameConversation={handleRenameConversation}
            searchQuery={searchQuery}
          />
        </div>
      </div>
    </>
  );
}

