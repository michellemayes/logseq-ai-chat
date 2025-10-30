# Add Task Management Integration

## Why

Logseq uses TODO/DOING/DONE markers for task tracking, but the current system doesn't parse, index, or query these markers. Users cannot:
- Query tasks by status ("show me all TODO items")
- Update task status via AI chat
- Find tasks due within a timeframe ("what tasks are due this week?")
- Generate task summaries from journal entries

This limits the app's ability to leverage Logseq's task management features and provide intelligent task-related assistance.

## What Changes

- Parse TODO/DOING/DONE markers from block content during indexing
- Index task status in the graph index alongside existing block metadata
- Add task query functions to search/filter blocks by task status
- Add IPC handlers for task queries (by status, date range, page)
- Enable AI to update task status via chat (change TODO → DOING → DONE)
- Add temporal task queries (find tasks in date range, tasks due this week)
- Add task summarization from journal entries
- Enhance LLM system prompt with task management capabilities
- Include task context in context injection when relevant

## Impact

- **Affected specs**: `graph-analysis` (task indexing), `content-creation` (status updates), `llm-integration` (task-aware prompts), `context-injection` (task context)
- **Affected code**:
  - `src-electron/graph/parser.ts` - Extract task markers from content
  - `src-electron/graph/index.ts` - Index task status in GraphIndex
  - `src-electron/graph/search.ts` - Add task query functions
  - `src-electron/ipc/handlers.ts` - Task query IPC handlers
  - `src-electron/filesystem/scanner.ts` - Update task status in files
  - `src-electron/types.d.ts` - Task-related types
  - `src-electron/llm/provider.ts` - Task-aware system prompt
  - `src/components/ChatInterface.tsx` - Task query handling in UI

