# settings Specification

## Purpose
TBD - created by archiving change add-logseq-ai-chat-mvp. Update Purpose after archive.
## Requirements
### Requirement: Application Settings
The system SHALL provide settings for Logseq path, LLM provider selection (Groq, OpenAI, Anthropic, Ollama), provider-specific API keys and models, theme preference, and auto-save preferences. The system SHALL also provide configurable context settings for controlling how much and what type of content is included in LLM context. Provider-specific settings SHALL be stored separately for each provider, allowing users to configure multiple providers simultaneously.

#### Scenario: Persist and apply settings
- **WHEN** a user updates settings
- **THEN** changes persist and take effect without requiring app restart
- **AND** provider-specific settings are saved independently

#### Scenario: Context settings configuration
- **WHEN** a user configures context settings (max pages, max blocks per page, max total blocks, search result limit, relevance threshold, block filtering mode, excluded namespaces, date range)
- **THEN** these settings are saved and applied to all subsequent context assembly operations
- **WHEN** context settings are not configured
- **THEN** system uses sensible defaults (5 pages, 50 blocks/page, 100 total blocks, threshold 1, 'all' mode)

### Requirement: Provider Selection
The system SHALL provide a provider selection dropdown in the settings panel allowing users to choose their preferred LLM provider. The selected provider SHALL be used for all LLM interactions until changed.

#### Scenario: Select provider from dropdown
- **WHEN** user opens settings panel
- **THEN** provider dropdown displays available providers (Groq, OpenAI, Anthropic, Ollama)
- **AND** current provider is pre-selected
- **AND** user can change selection to different provider

#### Scenario: Provider-specific settings display
- **WHEN** user selects a provider
- **THEN** settings panel shows API key field labeled for selected provider
- **AND** settings panel shows model dropdown with provider's available models
- **AND** for Ollama provider, endpoint configuration field is shown
- **AND** provider-specific fields are hidden when not applicable

#### Scenario: Multiple provider configuration
- **WHEN** user configures API keys and models for multiple providers
- **THEN** each provider's settings are stored independently
- **AND** user can switch between configured providers without re-entering credentials
- **AND** switching providers preserves all provider configurations

### Requirement: Provider-Specific Model Lists
The system SHALL display provider-specific model lists in the settings panel. Model options SHALL be dynamically shown based on the selected provider.

#### Scenario: Groq model selection
- **WHEN** user selects Groq provider
- **THEN** model dropdown shows Groq models (llama-3.3-70b-versatile, mistral-saba-24b, etc.)
- **AND** previously selected Groq model is pre-selected

#### Scenario: OpenAI model selection
- **WHEN** user selects OpenAI provider
- **THEN** model dropdown shows OpenAI models (gpt-4, gpt-3.5-turbo, etc.)
- **AND** previously selected OpenAI model is pre-selected

#### Scenario: Anthropic model selection
- **WHEN** user selects Anthropic provider
- **THEN** model dropdown shows Anthropic models (claude-3-opus, claude-3-sonnet, etc.)
- **AND** previously selected Anthropic model is pre-selected

#### Scenario: Ollama model selection
- **WHEN** user selects Ollama provider
- **THEN** model dropdown shows common Ollama models (llama2, mistral, etc.)
- **AND** user can enter custom model name
- **AND** previously selected Ollama model is pre-selected

### Requirement: Settings Validation
The system SHALL validate provider-specific settings before allowing LLM calls. Invalid or missing API keys SHALL display clear error messages.

#### Scenario: Missing API key validation
- **WHEN** user attempts to use a provider without configured API key
- **THEN** error message displays indicating missing API key
- **AND** error message specifies which provider needs configuration
- **AND** user is directed to settings panel

#### Scenario: Invalid Ollama endpoint
- **WHEN** user configures Ollama with invalid endpoint
- **THEN** error message displays when attempting LLM call
- **AND** default endpoint is suggested
- **AND** connection test could be performed to validate endpoint

### Requirement: Conversation Storage Settings
The system SHALL store conversation data separately from application settings. Conversation storage preferences MAY be configurable (e.g., maximum conversation count, auto-archive settings).

#### Scenario: Conversations stored separately from settings
- **WHEN** conversations are saved
- **THEN** they are stored in a separate electron-store instance from application settings
- **AND** conversation data is independent of settings changes

#### Scenario: Conversation storage location
- **WHEN** the app stores conversations
- **THEN** they are saved to the user's app data directory
- **AND** the storage location is managed by electron-store (OS-specific default paths)

