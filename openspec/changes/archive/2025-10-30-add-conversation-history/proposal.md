# Add Conversation History & Persistence

## Why
Currently, conversations are stored only in React state and are lost when the app closes or refreshes. Users cannot:
- Return to previous conversations
- Reference past discussions
- Search their conversation history
- Export or manage their chat data

This limits the app's usefulness as a knowledge management tool and prevents users from building on previous conversations.

## What Changes
- Persist conversations to local storage using electron-store
- Add conversation list/sidebar to view and resume previous conversations
- Implement search functionality to find conversations by content or date
- Add conversation management (delete, clear, rename)
- Store conversation metadata (title, timestamp, message count)
- Auto-save conversations as they occur
- Create new conversation flow with clear current conversation indicator

## Impact
- **Affected specs**: `ui-ux` (chat interface, sidebar), `settings` (storage preferences)
- **Affected code**: 
  - `src/components/ChatInterface.tsx` (conversation state management)
  - `src/components/Sidebar.tsx` (conversation list UI)
  - `src-electron/store/settings.ts` (conversation storage)
  - `src-electron/ipc/handlers.ts` (conversation IPC handlers)
  - `src-electron/types.d.ts` & `src/types.d.ts` (conversation data types)

