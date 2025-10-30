## MODIFIED Requirements

### Requirement: LLM Provider Integration (Groq)
The system SHALL integrate with Groq API for LLM responses. The Groq provider MUST support both streaming and non-streaming modes, with streaming as the preferred method. The provider SHALL use Server-Sent Events (SSE) format for streaming responses and parse tokens from the SSE stream. The system prompt SHALL inform the AI about graph traversal capabilities and enable it to use traversal queries for discovery and exploration.

#### Scenario: AI reads journal entry
- **WHEN** user asks about a journal entry
- **THEN** the system queries the graph for that journal
- **AND** includes the journal content in context
- **AND** the LLM response is streamed as tokens arrive

#### Scenario: AI reads specific page
- **WHEN** user asks about a specific page
- **THEN** the system queries the graph for that page
- **AND** includes the page content in context
- **AND** the LLM response is streamed as tokens arrive

#### Scenario: AI informed of graph access
- **WHEN** context is provided to the LLM
- **THEN** the system prompt informs the AI of direct graph access
- **AND** citations are included in the streamed response

#### Scenario: AI uses graph traversal for discovery
- **WHEN** a user asks about connected or related pages (e.g., "show pages connected to X")
- **THEN** the AI recognizes the query type and uses graph traversal functions
- **AND** traversal results are included in the response with citations

#### Scenario: Graph traversal capabilities in system prompt
- **WHEN** the system prompt is constructed
- **THEN** it includes information about graph traversal capabilities
- **AND** provides examples of traversal queries and when to use them

### Requirement: LLM Response Streaming
The system SHALL stream LLM response tokens as they arrive from the API, displaying them immediately in the chat interface. Streaming MUST maintain all existing functionality including action parsing and citation extraction.

#### Scenario: Stream tokens as they arrive
- **WHEN** a user sends a message and the LLM begins generating a response
- **THEN** tokens are displayed in the UI as they arrive from the API
- **AND** each token is appended to the message content immediately
- **AND** the full response is accumulated for parsing after stream completes

#### Scenario: Handle streaming errors gracefully
- **WHEN** a streaming error occurs during response generation
- **THEN** the system falls back to non-streaming mode automatically
- **AND** the user receives the complete response via standard method
- **AND** an error message is displayed if fallback also fails

#### Scenario: Parse actions from streamed response
- **WHEN** a streamed response contains LOGSEQ_ACTION tags
- **THEN** the full response is accumulated during streaming
- **AND** action parsing occurs after the stream completes
- **AND** file operations execute as normal

### Requirement: Streaming UI Feedback
The system SHALL provide visual feedback during streaming, including a typing indicator before the first token arrives and smooth content updates as tokens stream in.

#### Scenario: Show typing indicator during initialization
- **WHEN** a streaming response is initiated
- **THEN** a typing indicator is displayed immediately
- **AND** the indicator disappears when the first token arrives
- **AND** the indicator shows while waiting for API response

#### Scenario: Display streaming content smoothly
- **WHEN** tokens arrive during streaming
- **THEN** each token is appended to the message content immediately
- **AND** the UI scrolls to show new content automatically
- **AND** the message bubble updates without flickering or re-rendering

