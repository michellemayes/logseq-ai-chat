## ADDED Requirements
### Requirement: LLM Provider Integration (Groq)
The system SHALL integrate with Groq via a provider abstraction with configurable API key and model, defaulting to `mixtral-8x7b-32768` or `llama-3.1-70b-versatile`.

#### Scenario: Provider selection and key storage
- **WHEN** a user inputs an API key and selects a model
- **THEN** requests to the LLM succeed and credentials are stored securely

