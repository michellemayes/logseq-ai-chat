## MODIFIED Requirements
### Requirement: Application Settings
The system SHALL provide settings for Logseq path, Groq API key, model selection, provider selection (extensible), theme preference, and auto-save preferences. The system SHALL also provide configurable context settings for controlling how much and what type of content is included in LLM context.

#### Scenario: Persist and apply settings
- **WHEN** a user updates settings
- **THEN** changes persist and take effect without requiring app restart

#### Scenario: Context settings configuration
- **WHEN** a user configures context settings (max pages, max blocks per page, max total blocks, search result limit, relevance threshold, block filtering mode, excluded namespaces, date range)
- **THEN** these settings are saved and applied to all subsequent context assembly operations
- **WHEN** context settings are not configured
- **THEN** system uses sensible defaults (5 pages, 50 blocks/page, 100 total blocks, threshold 1, 'all' mode)

