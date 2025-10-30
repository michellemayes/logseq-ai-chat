# graph-analysis Specification

## Purpose
TBD - created by archiving change add-logseq-ai-chat-mvp. Update Purpose after archive.
## Requirements
### Requirement: Logseq Graph Analysis and Indexing
The system SHALL index pages, blocks, backlinks, forward links, tags, properties, namespaces, and journals to support search and traversal. The system MUST support querying specific pages or journal entries by name or date for direct retrieval when requested by the AI assistant. The system SHALL provide block-level relevance scoring and filtering capabilities to support intelligent context selection. The system SHALL support graph traversal queries to find pages connected through multiple hops, discover related pages through shared connections, and identify orphaned pages.

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

#### Scenario: Query connected pages
- **WHEN** a user or AI queries pages connected to a page (e.g., "show pages connected to X")
- **THEN** the system returns all pages that reference or are referenced by the page (backlinks and forward links combined)

#### Scenario: Graph traversal through multiple hops
- **WHEN** a user or AI requests pages connected through multiple hops (e.g., "show pages 2 hops away from X")
- **THEN** the system traverses the graph using breadth-first search up to the specified depth
- **AND** returns pages grouped by hop level

#### Scenario: Find related pages through shared connections
- **WHEN** a user or AI requests related pages (e.g., "find related pages about Y")
- **THEN** the system discovers pages connected through shared connections, tags, or properties
- **AND** ranks results by connection strength

#### Scenario: Discover orphaned pages
- **WHEN** a user or AI requests orphaned pages
- **THEN** the system returns pages with no backlinks and no forward links
- **AND** optionally filters out pages that have tags (considered connected via tags)

