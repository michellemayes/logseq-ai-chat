# Design: Conversation History & Persistence

## Context
Users need to persist and manage their chat conversations. Currently, conversations are stored only in React state and lost on app close. We need to add persistent storage, conversation management UI, and search capabilities.

## Goals / Non-Goals

### Goals
- Persist conversations across app sessions
- Allow users to resume previous conversations
- Enable searching conversation history
- Provide conversation management (delete, rename)
- Auto-save conversations as they occur
- Maintain performance with large conversation histories

### Non-Goals
- Cloud sync (local-only storage)
- Conversation sharing/export formats beyond markdown
- Conversation merging or advanced organization features
- Conversation templates or presets

## Decisions

### Decision: Use electron-store for conversation storage
**Why**: Consistent with existing settings storage pattern, built-in persistence, simple API.
**Alternatives considered**:
- SQLite: Overkill for simple conversation storage, adds complexity
- JSON files: Manual file handling needed, less convenient than electron-store
- IndexedDB: Browser-only, not suitable for Electron main process

### Decision: Store conversations in separate store from settings
**Why**: Keeps conversation data separate from app configuration, easier to manage separately.
**Alternatives considered**:
- Same store: Would mix concerns, harder to manage/export conversations separately

### Decision: Auto-generate conversation titles from first user message
**Why**: Simpler UX than requiring users to name conversations, can be edited later.
**Alternatives considered**:
- Default "Untitled Conversation": Less informative, requires manual naming
- Prompt for title: Interrupts flow, adds friction

### Decision: Sidebar-based conversation list
**Why**: Matches existing sidebar pattern, doesn't clutter main chat interface.
**Alternatives considered**:
- Separate window: More complex, breaks single-window UX
- Dropdown menu: Less discoverable, harder to browse many conversations

### Decision: Debounced auto-save (500ms debounce)
**Why**: Balances data safety with performance, avoids excessive disk writes.
**Alternatives considered**:
- Immediate save: Too many writes, performance impact
- Save on close only: Risk of data loss if app crashes

## Data Model

```typescript
interface Conversation {
  id: string;              // UUID or timestamp-based ID
  title: string;           // Auto-generated or user-edited
  createdAt: number;      // Unix timestamp
  updatedAt: number;       // Unix timestamp
  messages: Message[];     // Existing Message interface
}

interface ConversationMetadata {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  lastMessagePreview?: string; // First 100 chars of last message
}
```

## Storage Structure

```
electron-store/
  conversations.json
    {
      "conversations": {
        "uuid-1": { ...conversation },
        "uuid-2": { ...conversation }
      },
      "activeConversationId": "uuid-1",  // Last active conversation
      "nextId": 1  // Counter for ID generation
    }
```

## Risks / Trade-offs

### Risk: Large conversation history impacts performance
**Mitigation**: 
- Limit conversation list display (pagination or virtual scrolling)
- Lazy-load conversation content on selection
- Consider archiving old conversations

### Risk: Data corruption or loss
**Mitigation**:
- Validate conversation data on load
- Handle missing/corrupted conversations gracefully
- Consider backup/export functionality

### Risk: Storage size growth
**Mitigation**:
- Monitor storage size
- Add conversation limits or cleanup options
- Consider compression for old conversations

## Migration Plan

### Phase 1: Storage layer (no UI changes)
- Add conversation store
- Add IPC handlers
- No breaking changes to existing code

### Phase 2: UI updates
- Update Sidebar component
- Modify ChatInterface to use conversation store
- Maintain backward compatibility during transition

### Phase 3: Advanced features
- Search functionality
- Export/import
- Performance optimizations

## Open Questions

- Should conversations be limited to a maximum count? (e.g., 100 conversations)
- Should old conversations be automatically archived/cleaned up?
- Should conversation export include Logseq block references?

