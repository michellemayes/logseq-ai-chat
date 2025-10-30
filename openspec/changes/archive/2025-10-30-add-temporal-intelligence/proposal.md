# Add Temporal Intelligence

## Why

Logseq journals are temporal by nature, organized by date. Currently, the system can query individual journals but cannot:
- Query multiple journals by date range ("what did I write last week?")
- Compare journal entries across different dates
- Track changes or patterns over time
- Identify recurring content, tags, or topics in journals

This limits the app's ability to leverage the temporal dimension of Logseq journals for insights and discovery.

## What Changes

- Add journal date range queries to retrieve multiple journals within a timeframe
- Add journal comparison functionality to compare entries across dates
- Add pattern detection to identify recurring content, tags, or topics in journals
- Add temporal query functions (last week, last month, date range)
- Add IPC handlers for temporal queries
- Enhance LLM system prompt with temporal intelligence capabilities
- Include temporal context in context injection when queries mention time periods

## Impact

- **Affected specs**: `graph-analysis` (temporal queries), `llm-integration` (temporal-aware prompts), `context-injection` (temporal context)
- **Affected code**:
  - `src-electron/graph/search.ts` - Temporal query functions
  - `src-electron/ipc/handlers.ts` - Temporal query IPC handlers
  - `src-electron/types.d.ts` - Temporal query types
  - `src-electron/llm/provider.ts` - Temporal intelligence system prompt
  - `src/components/ChatInterface.tsx` - Temporal query handling
  - `src-electron/utils/contextFiltering.ts` - Enhanced date range queries

