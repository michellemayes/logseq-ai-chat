## 1. Task Parsing and Indexing
- [ ] 1.1 Add task marker extraction to `parseLogseqContent` (TODO, DOING, DONE, LATER, NOW, WAITING, CANCELED)
- [ ] 1.2 Update Block interface to include `taskStatus?: 'TODO' | 'DOING' | 'DONE' | 'LATER' | 'NOW' | 'WAITING' | 'CANCELED'`
- [ ] 1.3 Extract task markers from block content (format: `- TODO content` or `- DOING content`)
- [ ] 1.4 Add task status to IndexedPage blocks structure
- [ ] 1.5 Create task index map: `tasks: Map<'TODO' | 'DOING' | 'DONE', Set<string>>` in GraphIndex
- [ ] 1.6 Populate task index during `buildIndex` with page names containing tasks
- [ ] 1.7 Add task count tracking per page (TODO count, DOING count, DONE count)

## 2. Task Query Functions
- [ ] 2.1 Create `queryTasksByStatus(status: string, options?: { pageName?: string; dateRange?: { start: Date; end: Date } })` in search.ts
- [ ] 2.2 Create `queryTasksByPage(pageName: string)` to get all tasks in a page
- [ ] 2.3 Create `queryTasksByDateRange(start: Date, end: Date)` for temporal queries
- [ ] 2.4 Add task filtering to `searchGraph` when query contains task-related keywords
- [ ] 2.5 Create `getTaskSummary(journalDate: Date)` to summarize tasks from journal entries

## 3. IPC Handlers for Task Queries
- [ ] 3.1 Add `query-tasks` IPC handler accepting status, pageName, dateRange parameters
- [ ] 3.2 Add `get-task-summary` IPC handler for journal task summaries
- [ ] 3.3 Add `query-tasks-by-status` IPC handler
- [ ] 3.4 Add `query-tasks-by-page` IPC handler
- [ ] 3.5 Add `query-tasks-by-date-range` IPC handler
- [ ] 3.6 Expose task query methods in preload.ts ElectronAPI interface

## 4. Task Status Updates
- [ ] 4.1 Create `updateTaskStatus(pageName: string, blockId: string, newStatus: string)` function
- [ ] 4.2 Parse markdown file, find block by ID, update task marker
- [ ] 4.3 Write updated content back to file preserving structure
- [ ] 4.4 Add `update-task-status` IPC handler
- [ ] 4.5 Trigger re-index after task status update
- [ ] 4.6 Handle task status updates in chat actions (recognize "mark X as done")

## 5. LLM Integration
- [ ] 5.1 Update system prompt to inform AI about task management capabilities
- [ ] 5.2 Add examples of task queries and updates to system prompt
- [ ] 5.3 Include task context in context injection when user query mentions tasks
- [ ] 5.4 Add task-aware action parsing (recognize task update requests)
- [ ] 5.5 Update content creation handlers to support task status updates

## 6. Temporal Task Queries
- [ ] 6.1 Parse date properties (scheduled, deadline) from blocks
- [ ] 6.2 Index scheduled/deadline dates in task index
- [ ] 6.3 Create `queryTasksDueThisWeek()` function
- [ ] 6.4 Create `queryTasksDueBetween(start: Date, end: Date)` function
- [ ] 6.5 Add temporal query support to IPC handlers

## 7. Task Summarization
- [ ] 7.1 Create `generateTaskSummary(journalDate: Date)` function
- [ ] 7.2 Query tasks from journal entry for given date
- [ ] 7.3 Format task summary with status counts and descriptions
- [ ] 7.4 Add task summary to context when generating journal summaries

## 8. Testing and Validation
- [ ] 8.1 Unit tests for task marker parsing (TODO, DOING, DONE)
- [ ] 8.2 Unit tests for task indexing in buildIndex
- [ ] 8.3 Unit tests for task query functions
- [ ] 8.4 Integration tests for task status updates
- [ ] 8.5 Manual test: Query tasks by status via chat
- [ ] 8.6 Manual test: Update task status via "mark X as done"
- [ ] 8.7 Manual test: Query tasks due this week
- [ ] 8.8 Manual test: Generate task summary from journal

