import { useState, KeyboardEvent } from 'react';
import './MessageInput.css';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input-container">
      <textarea
        className="message-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'Configure settings first...' : 'Ask about your notes...'}
        disabled={disabled}
        rows={1}
      />
      <button
        className="send-button"
        onClick={handleSend}
        disabled={disabled || !input.trim()}
      >
        Send
      </button>
    </div>
  );
}

