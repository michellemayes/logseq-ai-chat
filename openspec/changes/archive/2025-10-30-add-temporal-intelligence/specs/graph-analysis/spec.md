## MODIFIED Requirements

### Requirement: Logseq Graph Analysis and Indexing
The system SHALL index pages, blocks, backlinks, forward links, tags, properties, namespaces, and journals to support search and traversal. The system MUST support querying specific pages or journal entries by name or date for direct retrieval when requested by the AI assistant. The system SHALL provide block-level relevance scoring and filtering capabilities to support intelligent context selection. The system SHALL support temporal queries to retrieve multiple journals by date range, compare journal entries across dates, and detect recurring patterns in journals.

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

#### Scenario: Query journals by date range
- **WHEN** a user or AI queries journals within a date range (e.g., "what did I write last week?")
- **THEN** the system returns all journals within the specified date range
- **AND** journals are returned with date metadata and content summaries

#### Scenario: Compare journal entries
- **WHEN** a user or AI requests to compare journals (e.g., "compare today's journal with last week")
- **THEN** the system compares the journals by content similarity, tag overlap, and activity levels
- **AND** returns comparison results with similarity scores

#### Scenario: Detect recurring patterns in journals
- **WHEN** a user or AI requests pattern detection (e.g., "what patterns do you see in my journals?")
- **THEN** the system analyzes journals for recurring tags, topics, or content
- **AND** returns patterns with frequency and examples

#### Scenario: Parse natural language date queries
- **WHEN** a user query contains natural language date references (e.g., "last week", "last month")
- **THEN** the system parses the date range and queries journals accordingly

