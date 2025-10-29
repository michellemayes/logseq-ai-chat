import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import { SettingsProvider } from './contexts/SettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SettingsProvider>
      <ThemeProvider>
        <div className="app">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <ChatInterface onOpenSidebar={() => setSidebarOpen(true)} />
        </div>
      </ThemeProvider>
    </SettingsProvider>
  );
}

export default App;

