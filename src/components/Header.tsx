import { useState, useEffect } from 'react';
import './Header.css';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenConversations: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
  activeConversationTitle?: string | null;
  activeConversationId?: string | null;
  onRenameConversation?: (id: string, newTitle: string) => void;
}

export default function Header({ 
  onOpenSidebar, 
  onOpenConversations, 
  onToggleTheme, 
  theme, 
  activeConversationTitle,
  activeConversationId,
  onRenameConversation 
}: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = () => {
    if (activeConversationTitle && activeConversationId) {
      setEditTitle(activeConversationTitle);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (activeConversationId && editTitle.trim() && onRenameConversation) {
      await onRenameConversation(activeConversationId, editTitle.trim());
      // Update local state immediately so UI reflects change before prop updates
      setIsEditing(false);
      setEditTitle('');
    } else {
      setIsEditing(false);
      setEditTitle('');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Reset editing state when conversation ID changes (but not when title changes)
  useEffect(() => {
    setIsEditing(false);
    setEditTitle('');
  }, [activeConversationId]);

  return (
    <header className="header">
      <button className="header-button" onClick={onOpenConversations} aria-label="Conversations">
        <svg width="20" height="20" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <path d="M343.644,129.572c25.132,0,49.092,4.961,71.144,13.708C384.072,62.48,305.95,5.048,214.381,5.048
            C95.985,5.048,0,101.033,0,219.433c0,52.546,18.935,100.658,50.315,137.936l-25.09,101.664l123.555-35.476
            c10.935,3.509,22.274,6.114,33.893,7.85c-20.773-30.876-32.924-68.016-32.924-107.946
            C149.749,216.551,236.728,129.572,343.644,129.572z" fill="currentColor"/>
          <path d="M512,327.249c0-88.798-71.988-160.787-160.782-160.787c-88.803,0-160.792,71.989-160.792,160.787
            c0,88.799,71.988,160.787,160.792,160.787c17.161,0,33.69-2.716,49.198-7.693l92.668,26.609l-18.814-76.246
            C497.804,402.748,512,366.661,512,327.249z" fill="currentColor"/>
        </svg>
      </button>
      <div className="header-title-container">
        {isEditing && activeConversationId ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="header-title-input"
            autoFocus
          />
        ) : (
          <h1 
            className="header-title"
            onClick={activeConversationId ? handleStartEdit : undefined}
            style={{ cursor: activeConversationId ? 'pointer' : 'default' }}
            title={activeConversationId ? 'Click to edit' : undefined}
          >
            {activeConversationTitle || 'Logseq AI Chat'}
          </h1>
        )}
      </div>
      <div className="header-actions">
        <button className="header-button" onClick={onOpenSidebar} aria-label="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M14.2788 2.15224C13.9085 2 13.439 2 12.5 2C11.561 2 11.0915 2 10.7212 2.15224C10.2274 2.35523 9.83509 2.74458 9.63056 3.23463C9.53719 3.45834 9.50065 3.7185 9.48635 4.09799C9.46534 4.65568 9.17716 5.17189 8.69017 5.45093C8.20318 5.72996 7.60864 5.71954 7.11149 5.45876C6.77318 5.2813 6.52789 5.18262 6.28599 5.15102C5.75609 5.08178 5.22018 5.22429 4.79616 5.5472C4.47814 5.78938 4.24339 6.1929 3.7739 6.99993C3.30441 7.80697 3.06967 8.21048 3.01735 8.60491C2.94758 9.1308 3.09118 9.66266 3.41655 10.0835C3.56506 10.2756 3.77377 10.437 4.0977 10.639C4.57391 10.936 4.88032 11.4419 4.88029 12C4.88026 12.5581 4.57386 13.0639 4.0977 13.3608C3.77372 13.5629 3.56497 13.7244 3.41645 13.9165C3.09108 14.3373 2.94749 14.8691 3.01725 15.395C3.06957 15.7894 3.30432 16.193 3.7738 17C4.24329 17.807 4.47804 18.2106 4.79606 18.4527C5.22008 18.7756 5.75599 18.9181 6.28589 18.8489C6.52778 18.8173 6.77305 18.7186 7.11133 18.5412C7.60852 18.2804 8.2031 18.27 8.69012 18.549C9.17714 18.8281 9.46533 19.3443 9.48635 19.9021C9.50065 20.2815 9.53719 20.5417 9.63056 20.7654C9.83509 21.2554 10.2274 21.6448 10.7212 21.8478C11.0915 22 11.561 22 12.5 22C13.439 22 13.9085 22 14.2788 21.8478C14.7726 21.6448 15.1649 21.2554 15.3694 20.7654C15.4628 20.5417 15.4994 20.2815 15.5137 19.902C15.5347 19.3443 15.8228 18.8281 16.3098 18.549C16.7968 18.2699 17.3914 18.2804 17.8886 18.5412C18.2269 18.7186 18.4721 18.8172 18.714 18.8488C19.2439 18.9181 19.7798 18.7756 20.2038 18.4527C20.5219 18.2105 20.7566 17.807 21.2261 16.9999C21.6956 16.1929 21.9303 15.7894 21.9827 15.395C22.0524 14.8691 21.9088 14.3372 21.5835 13.9164C21.4349 13.7243 21.2262 13.5628 20.9022 13.3608C20.4261 13.0639 20.1197 12.558 20.1197 11.9999C20.1197 11.4418 20.4261 10.9361 20.9022 10.6392C21.2263 10.4371 21.435 10.2757 21.5836 10.0835C21.9089 9.66273 22.0525 9.13087 21.9828 8.60497C21.9304 8.21055 21.6957 7.80703 21.2262 7C20.7567 6.19297 20.522 5.78945 20.2039 5.54727C19.7799 5.22436 19.244 5.08185 18.7141 5.15109C18.4722 5.18269 18.2269 5.28136 17.8887 5.4588C17.3915 5.71959 16.7969 5.73002 16.3099 5.45096C15.8229 5.17191 15.5347 4.65566 15.5136 4.09794C15.4993 3.71848 15.4628 3.45833 15.3694 3.23463C15.1649 2.74458 14.7726 2.35523 14.2788 2.15224ZM12.5 15C14.1695 15 15.5228 13.6569 15.5228 12C15.5228 10.3431 14.1695 9 12.5 9C10.8305 9 9.47716 10.3431 9.47716 12C9.47716 13.6569 10.8305 15 12.5 15Z" fill="currentColor"/>
          </svg>
        </button>
        <button className="header-button" onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 405.897 405.897" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M202.948,118.395c-46.623,0-84.561,37.931-84.561,84.554c0,46.631,37.938,84.562,84.561,84.562
                c46.624,0,84.561-37.931,84.561-84.562C287.509,156.325,249.571,118.395,202.948,118.395z M202.948,259.451
                c-31.155,0-56.502-25.349-56.502-56.502c0-31.148,25.347-56.495,56.502-56.495c31.155,0,56.502,25.347,56.502,56.495
                C259.45,234.102,234.103,259.451,202.948,259.451z"/>
              <path d="M202.948,98.59c7.749,0,14.03-6.282,14.03-14.029V14.03c0-7.748-6.281-14.029-14.03-14.029
                c-7.748,0-14.029,6.281-14.029,14.029v70.531C188.918,92.308,195.199,98.59,202.948,98.59z"/>
              <path d="M286.659,133.274c3.59,0,7.187-1.37,9.926-4.11l49.871-49.878c5.474-5.479,5.474-14.365-0.008-19.838
                c-5.479-5.48-14.357-5.48-19.838,0l-49.871,49.877c-5.48,5.48-5.48,14.365,0,19.839
                C279.479,131.904,283.069,133.274,286.659,133.274z"/>
              <path d="M391.866,188.919l-70.531,0.007c-7.754,0-14.028,6.281-14.028,14.029s6.282,14.029,14.028,14.029l70.531-0.007
                c7.748,0,14.031-6.28,14.031-14.029C405.897,195.2,399.614,188.919,391.866,188.919z"/>
              <path d="M296.571,276.748c-5.48-5.479-14.357-5.479-19.838,0c-5.481,5.479-5.48,14.365,0,19.839l49.877,49.87
                c2.74,2.74,6.33,4.109,9.92,4.109s7.186-1.369,9.926-4.109c5.474-5.479,5.474-14.365-0.008-19.838L296.571,276.748z"/>
              <path d="M202.934,307.306c-7.748,0-14.022,6.282-14.022,14.028l0.007,70.531c0,7.748,6.281,14.031,14.036,14.031
                c7.748,0,14.023-6.283,14.023-14.031l-0.008-70.531C216.97,313.589,210.688,307.306,202.934,307.306z"/>
              <path d="M109.303,276.74L59.44,326.619c-5.474,5.479-5.474,14.365,0.007,19.838c2.74,2.74,6.329,4.109,9.919,4.109
                s7.18-1.369,9.919-4.109l49.864-49.877c5.48-5.479,5.48-14.364,0-19.84C123.668,271.26,114.783,271.26,109.303,276.74z"/>
              <path d="M98.589,202.949c0-7.748-6.282-14.029-14.029-14.029H14.029C6.281,188.92,0,195.201,0,202.949
                c0,7.749,6.281,14.03,14.029,14.03H84.56C92.307,216.977,98.589,210.697,98.589,202.949z"/>
              <path d="M109.317,129.15c2.74,2.74,6.33,4.11,9.92,4.11c3.589,0,7.179-1.37,9.919-4.11c5.48-5.48,5.48-14.365,0-19.839
                L79.285,59.448c-5.479-5.48-14.365-5.48-19.845,0c-5.474,5.479-5.474,14.365,0.007,19.838L109.317,129.15z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 11.5373 21.3065 11.4608 21.0672 11.8568C19.9289 13.7406 17.8615 15 15.5 15C11.9101 15 9 12.0899 9 8.5C9 6.13845 10.2594 4.07105 12.1432 2.93276C12.5392 2.69347 12.4627 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor"/>
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
