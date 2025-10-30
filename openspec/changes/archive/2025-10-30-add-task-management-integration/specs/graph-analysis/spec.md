## MODIFIED Requirements

### Requirement: Logseq Graph Analysis and Indexing
The system SHALL index pages, blocks, backlinks, forward links, tags, properties, namespaces, and journals to support search and traversal. The system MUST support querying specific pages or journal entries by name or date for direct retrieval when requested by the AI assistant. The system SHALL provide block-level relevance scoring and filtering capabilities to support intelligent context selection. The system SHALL parse and index task status markers (TODO, DOING, DONE, LATER, NOW, WAITING, CANCELED) from blocks and support querying tasks by status, page, or date range.

#### Scenario: Query specific page by name
- **WHEN** a user or AI requests a specific page by name
- **THEN** the system returns the complete page content including all blocks, properties, and metadata

#### Scenario: Query journal entry by date
- **WHEN** a user or AI requests a journal entry by date (e.g., today's journal)
- **THEN** the system returns the complete journal entry content formatted as a Logseq page

#### Scenario: Full-text search across graph
- **WHEN** a user performs a search query
- **THEN** the system returns ranked results from pages and blocks matching the query, filtered by relevance threshold if configured

#### Scenario: Backlinks and forward links
- **WHEN** graph relationships are queried
- **THEN** the system provides backlinks and forward links for any page

#### Scenario: Block-level relevance scoring
- **WHEN** searching for content within a page
- **THEN** the system scores individual blocks based on keyword matches and can return top-scoring blocks ranked by relevance

#### Scenario: Search result filtering
- **WHEN** a search query is executed with a relevance threshold configured
- **THEN** only results scoring above the threshold are returned
- **WHEN** a search result limit is configured
- **THEN** the system returns at most that many results, sorted by score

#### Scenario: Query tasks by status
- **WHEN** a user or AI queries tasks by status (e.g., "show me all TODO items")
- **THEN** the system returns all blocks with matching task status across the graph

#### Scenario: Query tasks by page
- **WHEN** a user or AI queries tasks from a specific page
- **THEN** the system returns all task blocks from that page with their statuses

#### Scenario: Query tasks by date range
- **WHEN** a user or AI queries tasks within a date range (e.g., "tasks due this week")
- **THEN** the system returns tasks with scheduled/deadline properties within the date range

#### Scenario: Task indexing during graph build
- **WHEN** the graph index is built or rebuilt
- **THEN** the system parses task markers from all blocks and indexes them by status and page

#### Scenario: Task summarization from journal
- **WHEN** a user requests a task summary from a journal entry
- **THEN** the system returns a summary of all tasks in that journal with status counts and descriptions

