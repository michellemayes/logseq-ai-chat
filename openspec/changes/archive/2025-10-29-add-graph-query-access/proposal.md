## Why
The AI assistant incorrectly claims it doesn't have access to LogSeq files, even though the application maintains a full in-memory graph index. The AI needs to be informed that it has direct graph access and provided with query capabilities to retrieve specific pages and journal entries on demand. This will enable the AI to read journal entries, query pages by name, and answer questions about graph content directly.

## What Changes
- Add graph query functions to retrieve specific pages/journal entries by name or date
- Expose graph query handlers via IPC to the renderer process
- Update AI system prompt to inform it of graph access capabilities
- Add context injection for graph queries when AI needs specific page/journal data
- Enable AI to query today's journal or any page by name from the graph index

## Impact
- Affected specs: `graph-analysis` (add query capabilities), `context-injection` (enable on-demand graph queries), `llm-integration` (update prompt to reflect graph access)
- Affected code: `src-electron/graph/search.ts` (add `getPage`, `getJournal` functions), `src-electron/ipc/handlers.ts` (add query handlers), `src-electron/llm/provider.ts` (update prompt), `src/components/ChatInterface.tsx` (query graph before chat)

