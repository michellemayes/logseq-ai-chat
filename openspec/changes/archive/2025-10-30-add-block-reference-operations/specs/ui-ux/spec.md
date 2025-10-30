## MODIFIED Requirements

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

