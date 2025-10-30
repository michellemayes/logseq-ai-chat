# context-injection Specification

## Purpose
TBD - created by archiving change add-logseq-ai-chat-mvp. Update Purpose after archive.
## Requirements
### Requirement: Context Retrieval and Injection
The system SHALL analyze user queries, search the graph, assemble relevant pages/blocks with metadata (page names, block IDs, modification dates), and send the formatted context to the LLM. When queries explicitly reference a page name or journal date, the system MUST query the graph for that content before constructing the LLM context. The system SHALL respect configurable limits (max pages, blocks per page, total blocks) and apply relevance filtering to ensure only relevant content is included. When user queries mention graph traversal, connections, or related pages, the system SHALL include traversal results in the context sent to the LLM.

#### Scenario: Context includes specific journal when requested
- **WHEN** user query mentions "today's journal" or a specific date
- **THEN** the system queries the graph for that journal entry and includes it in context, respecting configured block limits

#### Scenario: Context includes specific page when requested
- **WHEN** user query mentions a page name (e.g., "[[Projects]]" or "the Projects page")
- **THEN** the system queries the graph for that page and includes it in context, respecting configured block limits

#### Scenario: Graph query and search combined
- **WHEN** user asks open-ended question about graph content
- **THEN** the system performs search first, filters results by relevance threshold, limits to configured search result count, then queries specific pages if referenced

#### Scenario: Context respects configured limits
- **WHEN** context assembly would exceed configured limits (max pages, max blocks per page, max total blocks)
- **THEN** the system stops adding pages/blocks at the limit, prioritizing explicitly mentioned pages and highest-scoring search results

#### Scenario: Block filtering by mode
- **WHEN** context settings specify 'matched' block filtering mode
- **THEN** only blocks containing query keywords are included in context
- **WHEN** context settings specify 'top' block filtering mode
- **THEN** only the highest-scoring blocks up to the limit are included

#### Scenario: Namespace exclusion
- **WHEN** context settings specify excluded namespaces
- **THEN** pages in those namespaces are excluded from context even if they match search queries

#### Scenario: Date range filtering for journals
- **WHEN** context settings specify a date range (e.g., only last 30 days)
- **THEN** only journals within that date range are included in search results

#### Scenario: Include traversal results in context
- **WHEN** a user query mentions connected pages, related pages, or graph traversal
- **THEN** the system executes traversal queries and includes results in context
- **AND** traversal results are formatted with page names and connection metadata

#### Scenario: Prioritize traversal results for connection queries
- **WHEN** a user explicitly queries for connected or related pages
- **THEN** the system uses traversal functions instead of general search
- **AND** traversal results are prioritized in context assembly

