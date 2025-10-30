# context-injection Specification

## Purpose
TBD - created by archiving change add-logseq-ai-chat-mvp. Update Purpose after archive.
## Requirements
### Requirement: Context Retrieval and Injection
The system SHALL analyze user queries, search the graph, assemble relevant pages/blocks with metadata (page names, block IDs, modification dates), and send the formatted context to the LLM. When queries explicitly reference a page name or journal date, the system MUST query the graph for that content before constructing the LLM context. The system SHALL respect configurable limits (max pages, blocks per page, total blocks) and apply relevance filtering to ensure only relevant content is included. When user queries mention time periods, date ranges, or temporal concepts, the system SHALL query journals by date range and include temporal context in the context sent to the LLM.

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

#### Scenario: Include temporal context for date range queries
- **WHEN** a user query mentions a time period (e.g., "last week", "last month")
- **THEN** the system queries journals within that date range and includes summaries in context
- **AND** journal summaries respect configured block limits

#### Scenario: Include journal comparison results
- **WHEN** a user query requests journal comparison
- **THEN** the system includes comparison results (similarity scores, differences) in context

#### Scenario: Include pattern detection results
- **WHEN** a user query requests pattern detection
- **THEN** the system includes detected patterns (recurring tags, topics) in context

