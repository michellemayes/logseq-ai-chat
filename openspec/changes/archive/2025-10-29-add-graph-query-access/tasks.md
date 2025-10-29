## 1. Implementation
- [x] 1.1 Add `getPage(pageName: string)` function to graph/search.ts to retrieve page by name
- [x] 1.2 Add `getJournal(dateStr: string)` function to retrieve journal entry by date (YYYY_MM_DD format)
- [x] 1.3 Add IPC handlers `get-page` and `get-journal` in handlers.ts
- [x] 1.4 Expose graph query methods in preload.ts and types
- [x] 1.5 Update AI system prompt to inform it has graph access and how to query
- [x] 1.6 Add logic to detect when user asks about a specific page/journal and query graph before sending to LLM
- [x] 1.7 Test: Verify AI can read today's journal when asked

## 2. Validation
- [x] 2.1 Manual test: Ask "What's in today's journal?" - verify AI reads actual content
- [x] 2.2 Manual test: Ask about a specific page by name - verify AI retrieves it from graph
- [x] 2.3 Verify AI no longer says it doesn't have access

