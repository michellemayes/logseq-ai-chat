## MODIFIED Requirements
### Requirement: LLM Provider Integration (Groq)
The system SHALL integrate with Groq via a provider abstraction with configurable API key and model, defaulting to `mixtral-8x7b-32768` or `llama-3.1-70b-versatile`. The system SHALL inform the AI assistant that it has direct access to the LogSeq graph. The AI MUST be able to query the graph for specific pages or journal entries when needed. The system prompt SHALL explicitly state that the AI has graph access and can retrieve pages/journal entries on demand.

#### Scenario: AI reads journal entry
- **WHEN** user asks "What's in today's journal?" or similar query
- **THEN** the system queries the graph for the journal entry and provides full content to the AI

#### Scenario: AI reads specific page
- **WHEN** user asks about a specific page (e.g., "What's in my Projects page?")
- **THEN** the system queries the graph for that page and provides full content to the AI

#### Scenario: AI informed of graph access
- **WHEN** AI receives system prompt
- **THEN** the prompt explicitly states the AI has direct graph access and can query pages/journal entries

