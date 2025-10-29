## ADDED Requirements

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

