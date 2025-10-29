## ADDED Requirements
### Requirement: Logseq File System Integration
The system SHALL allow configuring a Logseq graph path, recursively scan `.md` files under `/pages/`, `/journals/`, and `/logseq/`, parse YAML frontmatter, and watch for changes with debounced re-indexing.

#### Scenario: Configure graph path and index
- **WHEN** a user sets a valid Logseq directory path
- **THEN** the system scans and indexes markdown files and metadata

#### Scenario: React to file changes
- **WHEN** a file is created, updated, or deleted in the graph
- **THEN** the index updates after a debounce interval

