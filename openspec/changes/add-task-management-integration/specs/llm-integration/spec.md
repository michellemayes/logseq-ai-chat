## MODIFIED Requirements

### Requirement: LLM Provider Integration (Groq)
The system SHALL integrate with Groq API for LLM responses. The Groq provider MUST support both streaming and non-streaming modes, with streaming as the preferred method. The provider SHALL use Server-Sent Events (SSE) format for streaming responses and parse tokens from the SSE stream. The system prompt SHALL inform the AI about task management capabilities, including querying tasks by status, updating task status, and generating task summaries.

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

#### Scenario: AI understands task queries
- **WHEN** a user asks about tasks (e.g., "what tasks are due this week?")
- **THEN** the AI recognizes the query type and uses task query functions to retrieve relevant tasks

#### Scenario: AI can update task status
- **WHEN** a user requests to update a task status (e.g., "mark X as done")
- **THEN** the AI recognizes the request and uses task update functions to modify the task marker

#### Scenario: Task context in system prompt
- **WHEN** the system prompt is constructed
- **THEN** it includes information about task management capabilities and examples of task queries/updates

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

