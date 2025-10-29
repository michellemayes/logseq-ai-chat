import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import ConversationsPanel from './components/ConversationsPanel';
import { SettingsProvider } from './contexts/SettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversationsPanelOpen, setConversationsPanelOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <SettingsProvider>
      <ThemeProvider>
        <div className="app">
          <ConversationsPanel
            isOpen={conversationsPanelOpen}
            onClose={() => setConversationsPanelOpen(false)}
            onSelectConversation={setSelectedConversationId}
          />
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <ChatInterface
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenConversations={() => setConversationsPanelOpen(true)}
            conversationId={selectedConversationId}
            onConversationChange={setSelectedConversationId}
          />
        </div>
      </ThemeProvider>
    </SettingsProvider>
  );
}

export default App;

