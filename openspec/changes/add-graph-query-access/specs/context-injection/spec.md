## MODIFIED Requirements
### Requirement: Context Injection with On-Demand Graph Queries
The system SHALL analyze user queries to determine when specific pages or journal entries need to be retrieved from the graph. When queries explicitly reference a page name or journal date, the system MUST query the graph for that content before constructing the LLM context.

#### Scenario: Context includes specific journal when requested
- **WHEN** user query mentions "today's journal" or a specific date
- **THEN** the system queries the graph for that journal entry and includes it in context

#### Scenario: Context includes specific page when requested
- **WHEN** user query mentions a page name (e.g., "[[Projects]]" or "the Projects page")
- **THEN** the system queries the graph for that page and includes it in context

#### Scenario: Graph query and search combined
- **WHEN** user asks open-ended question about graph content
- **THEN** the system performs search first, then queries specific pages if referenced

