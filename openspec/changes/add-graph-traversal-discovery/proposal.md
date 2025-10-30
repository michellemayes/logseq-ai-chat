# Add Graph Traversal and Discovery

## Why

Logseq's power comes from interconnections between pages. Currently, the system can query direct backlinks and forward links but cannot:
- Find pages connected through multiple hops (graph traversal)
- Discover related pages through shared connections
- Identify orphaned pages (pages with no connections)
- Visualize relationship networks
- Answer queries like "show pages connected to X" combining both directions

This limits the app's ability to leverage the graph structure for discovery and exploration of related content.

## What Changes

- Add graph traversal functions to find pages connected through multiple hops
- Add "connected pages" query combining backlinks and forward links
- Add related pages discovery through shared connections or tags
- Add orphaned page detection (pages with no backlinks or forward links)
- Add IPC handlers for graph traversal queries
- Enhance LLM system prompt with graph traversal capabilities
- Add UI support for displaying connected pages and graph relationships

## Impact

- **Affected specs**: `graph-analysis` (traversal functions), `llm-integration` (traversal-aware prompts), `ui-ux` (relationship display)
- **Affected code**:
  - `src-electron/graph/search.ts` - Graph traversal functions
  - `src-electron/ipc/handlers.ts` - Traversal query IPC handlers
  - `src-electron/types.d.ts` - Traversal query types
  - `src-electron/llm/provider.ts` - Graph traversal system prompt
  - `src/components/ChatInterface.tsx` - Traversal query handling
  - `src/components/MessageBubble.tsx` - Connected pages display

