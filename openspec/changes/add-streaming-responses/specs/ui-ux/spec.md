## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Chat UI and Citations Experience
The system SHALL provide a single-panel chat interface with inline citations, context cards, and a collapsible sidebar for settings and actions. Theme toggle must persist preference and default to system setting on first launch. The interface SHALL support streaming responses with real-time token display and typing indicators.

#### Scenario: Display citations with context
- **WHEN** an AI response uses Logseq context
- **THEN** inline citations and cards show sources and allow copying references

#### Scenario: Streaming response display
- **WHEN** the AI generates a streaming response
- **THEN** tokens are displayed as they arrive
- **AND** the UI provides visual feedback during streaming
- **AND** citations are extracted after streaming completes

