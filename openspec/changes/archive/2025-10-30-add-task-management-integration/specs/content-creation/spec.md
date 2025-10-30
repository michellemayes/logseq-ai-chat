## MODIFIED Requirements

### Requirement: Journal and Page Content Creation
The system SHALL create or append journal entries and pages with correct Logseq formats, including frontmatter, properties, tags, indentation, and block IDs where applicable. When appending to existing journals, the system MUST correctly identify the journal file path and append content, or create the journal with proper date header if it does not exist. The system SHALL support updating task status markers in existing blocks when requested by the AI assistant.

#### Scenario: Create daily journal entry
- **WHEN** a user triggers journal creation
- **THEN** a `journals/YYYY_MM_DD.md` entry is created or appended with the correct header and bullets

#### Scenario: Update existing journal entry
- **WHEN** a user requests to update or add content to today's journal
- **THEN** the system appends the content to the existing `journals/YYYY_MM_DD.md` file, preserving existing content

#### Scenario: Create journal when updating non-existent entry
- **WHEN** a user requests to update a journal that doesn't exist
- **THEN** the system creates the journal file with proper date header before appending content

#### Scenario: Create page with sanitized name
- **WHEN** a user creates a new page
- **THEN** a page file is created under `/pages/` with sanitized name and YAML frontmatter

#### Scenario: Update task status via chat
- **WHEN** a user requests to update a task status (e.g., "mark 'Review PR' as done")
- **THEN** the system finds the block containing the task, updates the task marker, and writes the change back to the file

#### Scenario: Update task status preserves block structure
- **WHEN** a task status is updated
- **THEN** the system preserves block ID, indentation, properties, tags, and child blocks

#### Scenario: Task status update triggers re-index
- **WHEN** a task status is successfully updated
- **THEN** the system re-indexes the affected page to reflect the change in the graph index

