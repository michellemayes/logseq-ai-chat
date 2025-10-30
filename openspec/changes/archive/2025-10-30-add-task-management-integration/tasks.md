## 1. Task Parsing and Indexing
- [x] 1.1 Add task marker extraction to `parseLogseqContent` (TODO, DOING, DONE, LATER, NOW, WAITING, CANCELED)
- [x] 1.2 Update Block interface to include `taskStatus?: 'TODO' | 'DOING' | 'DONE' | 'LATER' | 'NOW' | 'WAITING' | 'CANCELED'`
- [x] 1.3 Extract task markers from block content (format: `- TODO content` or `- DOING content`)
- [x] 1.4 Add task status to IndexedPage blocks structure
- [x] 1.5 Create task index map: `tasks: Map<'TODO' | 'DOING' | 'DONE', Set<string>>` in GraphIndex
- [x] 1.6 Populate task index during `buildIndex` with page names containing tasks
- [x] 1.7 Add task count tracking per page (TODO count, DOING count, DONE count)

## 2. Task Query Functions
- [x] 2.1 Create `queryTasksByStatus(status: string, options?: { pageName?: string; dateRange?: { start: Date; end: Date } })` in search.ts
- [x] 2.2 Create `queryTasksByPage(pageName: string)` to get all tasks in a page
- [x] 2.3 Create `queryTasksByDateRange(start: Date, end: Date)` for temporal queries
- [ ] 2.4 Add task filtering to `searchGraph` when query contains task-related keywords
- [x] 2.5 Create `getTaskSummary(journalDate: Date)` to summarize tasks from journal entries

## 3. IPC Handlers for Task Queries
- [x] 3.1 Add `query-tasks` IPC handler accepting status, pageName, dateRange parameters
- [x] 3.2 Add `get-task-summary` IPC handler for journal task summaries
- [x] 3.3 Add `query-tasks-by-status` IPC handler
- [x] 3.4 Add `query-tasks-by-page` IPC handler
- [x] 3.5 Add `query-tasks-by-date-range` IPC handler
- [x] 3.6 Expose task query methods in preload.ts ElectronAPI interface

## 4. Task Status Updates
- [x] 4.1 Create `updateTaskStatus(pageName: string, blockId: string, newStatus: string)` function
- [x] 4.2 Parse markdown file, find block by ID, update task marker
- [x] 4.3 Write updated content back to file preserving structure
- [x] 4.4 Add `update-task-status` IPC handler
- [x] 4.5 Trigger re-index after task status update
- [x] 4.6 Handle task status updates in chat actions (recognize "mark X as done")

## 5. LLM Integration
- [x] 5.1 Update system prompt to inform AI about task management capabilities
- [x] 5.2 Add examples of task queries and updates to system prompt
- [x] 5.3 Include task context in context injection when user query mentions tasks
- [x] 5.4 Add task-aware action parsing (recognize task update requests)
- [x] 5.5 Update content creation handlers to support task status updates

## 6. Temporal Task Queries
- [x] 6.1 Parse date properties (scheduled, deadline) from blocks
- [x] 6.2 Index scheduled/deadline dates in task index
- [x] 6.3 Create `queryTasksDueThisWeek()` function
- [x] 6.4 Create `queryTasksDueBetween(start: Date, end: Date)` function
- [x] 6.5 Add temporal query support to IPC handlers

## 7. Task Summarization
- [x] 7.1 Create `generateTaskSummary(journalDate: Date)` function
- [x] 7.2 Query tasks from journal entry for given date
- [x] 7.3 Format task summary with status counts and descriptions
- [x] 7.4 Add task summary to context when generating journal summaries

## 8. Testing and Validation
- [ ] 8.1 Unit tests for task marker parsing (TODO, DOING, DONE)
- [ ] 8.2 Unit tests for task indexing in buildIndex
- [ ] 8.3 Unit tests for task query functions
- [ ] 8.4 Integration tests for task status updates
- [ ] 8.5 Manual test: Query tasks by status via chat
- [ ] 8.6 Manual test: Update task status via "mark X as done"
- [ ] 8.7 Manual test: Query tasks due this week
- [ ] 8.8 Manual test: Generate task summary from journal
