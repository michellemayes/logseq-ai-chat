## 1. Connected Pages Query
- [x] 1.1 Create `getConnectedPages(pageName: string)` function combining backlinks and forward links
- [x] 1.2 Return unique set of connected pages (no duplicates)
- [x] 1.3 Add `get-connected-pages` IPC handler
- [x] 1.4 Expose connected pages query in preload.ts ElectronAPI interface
- [x] 1.5 Add connected pages types to types.d.ts

## 2. Graph Traversal Functions
- [x] 2.1 Create `traverseGraph(pageName: string, maxHops: number)` function
- [x] 2.2 Implement breadth-first search traversal algorithm
- [x] 2.3 Track visited pages to prevent cycles
- [x] 2.4 Return pages grouped by hop level (1-hop, 2-hop, 3-hop)
- [x] 2.5 Add `traverse-graph` IPC handler
- [x] 2.6 Add traversal result types (pages with hop level)

## 3. Related Pages Discovery
- [x] 3.1 Create `findRelatedPages(pageName: string, options?: { maxHops?: number })` function
- [x] 3.2 Find pages connected through shared connections
- [x] 3.3 Find pages connected through shared tags
- [x] 3.4 Find pages connected through shared properties
- [x] 3.5 Score/reRank related pages by connection strength
- [x] 3.6 Add `find-related-pages` IPC handler

## 4. Orphaned Page Detection
- [x] 4.1 Create `findOrphanedPages(options?: { includeTagged?: boolean })` function
- [x] 4.2 Identify pages with no backlinks and no forward links
- [x] 4.3 Optionally filter out pages with tags (considered "connected" via tags)
- [x] 4.4 Add `find-orphaned-pages` IPC handler
- [x] 4.5 Return orphaned pages list with metadata

## 5. LLM Integration
- [x] 5.1 Update system prompt to inform AI about graph traversal capabilities
- [x] 5.2 Add examples of traversal queries ("show pages connected to X")
- [x] 5.3 Instruct AI to use traversal for discovery queries
- [x] 5.4 Include traversal results in context when relevant

## 6. Context Injection
- [x] 6.1 Detect traversal-related queries in user input
- [x] 6.2 Include connected pages in context when user asks about connections
- [x] 6.3 Include related pages in context for discovery queries
- [x] 6.4 Add traversal results to citation metadata

## 7. UI Support
- [x] 7.1 Display connected pages in message citations
- [x] 7.2 Format traversal results showing hop levels
- [x] 7.3 Display related pages with connection strength indicators
- [x] 7.4 Show orphaned pages list when requested
- [x] 7.5 Make connected pages clickable to navigate

## 8. Testing and Validation
- [ ] 8.1 Unit tests for `getConnectedPages` function
- [ ] 8.2 Unit tests for `traverseGraph` function (test cycles, depth limits)
- [ ] 8.3 Unit tests for `findRelatedPages` function
- [ ] 8.4 Unit tests for `findOrphanedPages` function
- [ ] 8.5 Integration tests for traversal IPC handlers
- [ ] 8.6 Manual test: Query "show pages connected to X"
- [ ] 8.7 Manual test: Query "find related pages about Y"
- [ ] 8.8 Manual test: Query "show orphaned pages"
- [ ] 8.9 Performance test: Traversal on large graph (1000+ pages)

