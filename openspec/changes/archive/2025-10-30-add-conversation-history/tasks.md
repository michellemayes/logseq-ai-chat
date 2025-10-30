# Tasks: Add Conversation History & Persistence

## Phase 1: Data Model & Storage
- [x] 1.1 Define conversation data structures in types
  - Conversation interface with id, title, createdAt, updatedAt, messages[]
  - Message interface matches existing Message type
- [x] 1.2 Create conversation store using electron-store
  - Store conversations in separate store from settings
  - Implement CRUD operations (create, read, update, delete)
  - Generate unique IDs for conversations
- [x] 1.3 Add IPC handlers for conversation operations
  - getConversations() - list all conversations
  - getConversation(id) - get specific conversation
  - saveConversation(conversation) - create/update
  - deleteConversation(id) - remove conversation
  - searchConversations(query) - search conversation content

## Phase 2: UI Components
- [x] 2.1 Update Sidebar to show conversation list
  - Display conversation titles and timestamps
  - Show active/current conversation indicator
  - Add "New Conversation" button
- [x] 2.2 Add conversation list item component
  - Click to resume conversation
  - Show preview/last message snippet
  - Context menu for delete/rename
- [x] 2.3 Update ChatInterface to manage conversation state
  - Load conversation on mount/selection
  - Auto-save messages as they're added
  - Generate conversation title from first user message
- [x] 2.4 Add conversation search UI
  - Search input in sidebar
  - Filter conversations by content or date
  - Highlight search matches

## Phase 3: Conversation Management
- [x] 3.1 Implement conversation deletion
  - Delete button/context menu action
  - Confirmation dialog for deletion
  - Remove from store and update UI
- [x] 3.2 Implement conversation renaming
  - Edit title inline or via dialog
  - Update in store
- [x] 3.3 Add "Clear All" conversations option
  - Settings or sidebar action
  - Confirmation dialog
  - Clear all conversations from store

## Phase 4: Persistence & Auto-save
- [x] 4.1 Auto-save conversation on message add
  - Debounce saves to avoid excessive writes
  - Update conversation timestamp
  - Handle errors gracefully
- [x] 4.2 Load conversation on app start
  - Restore last active conversation or show new
  - Handle missing/corrupted conversations
- [x] 4.3 Add conversation export functionality
  - Export to markdown format
  - Include citations and metadata
  - Optional: export to Logseq format

## Phase 5: Validation & Testing
- [x] 5.1 Test conversation persistence
  - Verify conversations survive app restart
  - Test with many conversations (100+)
- [x] 5.2 Test conversation search
  - Search by message content
  - Search by date range
  - Verify performance with large history
- [x] 5.3 Test edge cases
  - Missing/corrupted conversation files
  - Empty conversations
  - Very long conversations
- [x] 5.4 Manual testing
  - Create, resume, delete conversations
  - Verify auto-save works
  - Test search functionality

