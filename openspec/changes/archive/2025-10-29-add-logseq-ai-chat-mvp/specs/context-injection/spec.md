## ADDED Requirements
### Requirement: Context Retrieval and Injection
The system SHALL analyze a user query, search the graph, assemble relevant pages/blocks with metadata (page names, block IDs, modification dates), and send the formatted context to the LLM.

#### Scenario: Relevant context bundled with citations
- **WHEN** a user asks a question
- **THEN** the system sends selected context to the LLM and displays citations

