# ui-ux Specification

## Purpose
TBD - created by archiving change add-logseq-ai-chat-mvp. Update Purpose after archive.
## Requirements
### Requirement: Chat UI and Citations Experience
The system SHALL provide a single-panel chat interface with inline citations, context cards, and a collapsible sidebar for settings and actions. Theme toggle must persist preference and default to system setting on first launch. The interface SHALL support streaming responses with real-time token display and typing indicators. Block references `((block-id))` in messages SHALL be rendered as clickable links that navigate to the referenced blocks.

#### Scenario: Display citations with context
- **WHEN** an AI response uses Logseq context
- **THEN** inline citations and cards show sources and allow copying references

#### Scenario: Streaming response display
- **WHEN** the AI generates a streaming response
- **THEN** tokens are displayed as they arrive
- **AND** the UI provides visual feedback during streaming
- **AND** citations are extracted after streaming completes

#### Scenario: Render block references as clickable links
- **WHEN** a message contains block references `((block-id))`
- **THEN** block references are rendered as clickable links
- **AND** clicking a block reference navigates to the referenced block
- **AND** block references are visually distinct from regular text

#### Scenario: Navigate to referenced block
- **WHEN** a user clicks a block reference link
- **THEN** the system queries the block by ID
- **AND** opens the parent page containing the block
- **AND** scrolls to or highlights the referenced block

#### Scenario: Handle missing block references
- **WHEN** a block reference points to a non-existent block
- **THEN** the system displays an error message or indicates the block is not found
- **AND** the block reference is still visible but not clickable

### Requirement: Streaming Response Display
The system SHALL display streaming LLM responses with tokens appearing in real-time. The UI SHALL show a typing indicator during stream initialization and update smoothly as tokens arrive.

#### Scenario: Show typing indicator before streaming starts
- **WHEN** a message is sent and streaming is initiated
- **THEN** a typing indicator is displayed immediately
- **AND** the indicator uses an animated visual (e.g., animated dots or cursor)
- **AND** the indicator disappears when the first token arrives

#### Scenario: Update message content during streaming
- **WHEN** tokens arrive from the streaming response
- **THEN** each token is appended to the message content immediately
- **AND** the message bubble scrolls to show new content
- **AND** text rendering is smooth without flickering

#### Scenario: Handle streaming completion
- **WHEN** the streaming response completes
- **THEN** the typing indicator is removed
- **AND** the final message content is finalized
- **AND** citations and actions are processed from the complete response
- **AND** block references are parsed and rendered as clickable links

### Requirement: Conversation Persistence
The system SHALL persist conversations to local storage and restore them across app sessions. Conversations MUST be auto-saved as messages are added, and the system SHALL handle missing or corrupted conversation data gracefully.

#### Scenario: Auto-save conversation on message add
- **WHEN** a user sends a message or receives an AI response
- **THEN** the conversation is automatically saved to local storage within 500ms (debounced)
- **AND** the conversation's updatedAt timestamp is refreshed

#### Scenario: Restore conversation on app start
- **WHEN** the app starts
- **THEN** the last active conversation is loaded and displayed
- **OR** if no previous conversation exists, a new empty conversation is created

#### Scenario: Handle corrupted conversation data
- **WHEN** a conversation file is corrupted or missing
- **THEN** the system skips that conversation and continues loading others
- **AND** shows an error message if the active conversation is corrupted

### Requirement: Conversation List Management
The system SHALL provide a conversation list in the sidebar showing all saved conversations with their titles, timestamps, and last message previews. Users MUST be able to click a conversation to resume it.

#### Scenario: Display conversation list in sidebar
- **WHEN** the sidebar is open
- **THEN** all saved conversations are displayed as a list
- **AND** each item shows conversation title, last updated timestamp, and preview of last message

#### Scenario: Resume previous conversation
- **WHEN** a user clicks on a conversation in the list
- **THEN** that conversation's messages are loaded and displayed in the chat interface
- **AND** the conversation is marked as active
- **AND** new messages are appended to the resumed conversation

#### Scenario: Create new conversation
- **WHEN** a user clicks "New Conversation" button
- **THEN** a new empty conversation is created
- **AND** the current conversation (if any) is saved
- **AND** the new conversation becomes active

### Requirement: Conversation Search
The system SHALL allow users to search conversation history by message content or date. Search results MUST highlight matching conversations and allow quick navigation to them.

#### Scenario: Search conversations by content
- **WHEN** a user enters a search query in the conversation search input
- **THEN** conversations containing matching text in any message are displayed
- **AND** results are ordered by relevance or recency
- **AND** clicking a result loads that conversation

#### Scenario: Search conversations by date
- **WHEN** a user filters conversations by date range
- **THEN** only conversations created or updated within that range are shown

### Requirement: Conversation Management Actions
The system SHALL allow users to delete individual conversations, rename conversations, and clear all conversations. All destructive actions MUST require confirmation.

#### Scenario: Delete a conversation
- **WHEN** a user selects delete from a conversation's context menu
- **THEN** a confirmation dialog is shown
- **AND** if confirmed, the conversation is removed from storage
- **AND** if it was the active conversation, a new conversation is created

#### Scenario: Rename a conversation
- **WHEN** a user selects rename from a conversation's context menu
- **THEN** an edit dialog or inline editor is shown
- **AND** the conversation title can be updated
- **AND** the updated title is saved to storage

#### Scenario: Clear all conversations
- **WHEN** a user selects "Clear All" from settings or sidebar menu
- **THEN** a confirmation dialog warns about data loss
- **AND** if confirmed, all conversations are deleted from storage
- **AND** a new empty conversation is created

### Requirement: Conversation Title Generation
The system SHALL automatically generate conversation titles from the first user message. Users MUST be able to edit these titles later.

#### Scenario: Auto-generate title from first message
- **WHEN** a user sends the first message in a new conversation
- **THEN** the conversation title is generated from the first 50 characters of that message
- **AND** special characters are sanitized for filename safety
- **AND** if the message is shorter than 50 characters, the full message is used

#### Scenario: Edit conversation title
- **WHEN** a user edits a conversation title
- **THEN** the new title is saved to storage immediately
- **AND** the updated title is reflected in the conversation list

