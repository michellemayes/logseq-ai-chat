## ADDED Requirements
### Requirement: Journal and Page Content Creation
The system SHALL create or append journal entries and pages with correct LogSeq formats, including frontmatter, properties, tags, indentation, and block IDs where applicable.

#### Scenario: Create daily journal entry
- **WHEN** a user triggers journal creation
- **THEN** a `journals/YYYY_MM_DD.md` entry is created or appended with the correct header and bullets

#### Scenario: Create page with sanitized name
- **WHEN** a user creates a new page
- **THEN** a page file is created under `/pages/` with sanitized name and YAML frontmatter

