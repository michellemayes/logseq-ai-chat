## Context

Logseq pages are connected through page references `[[Page Name]]`. Currently, the system can query direct backlinks (pages that reference a page) and forward links (pages referenced by a page), but cannot traverse the graph to find indirectly connected pages or discover related content through shared connections.

## Goals / Non-Goals

### Goals
- Find pages connected through multiple hops (1-hop, 2-hop, etc.)
- Query "connected pages" combining backlinks and forward links
- Discover related pages through shared connections or tags
- Identify orphaned pages (no connections)
- Enable AI to use graph traversal for discovery queries

### Non-Goals
- Graph visualization/rendering UI
- Graph analytics/metrics
- Path finding between specific pages
- Graph optimization algorithms

## Decisions

### Decision: Traversal Depth Limit
Limit graph traversal to maximum 3 hops by default, configurable up to 5.

**Rationale**: Prevents infinite loops and performance issues while providing useful discovery.

### Decision: Connected Pages Query
`getConnectedPages(pageName: string)` returns union of backlinks and forward links (1-hop).

**Rationale**: Most common use case - "show me everything connected to this page."

### Decision: Traversal Algorithm
Use breadth-first search (BFS) for traversal to find pages at each hop level.

**Rationale**: BFS naturally finds shortest paths and explores systematically.

### Decision: Related Pages Discovery
`findRelatedPages(pageName: string, options?: { maxHops?: number; minConnections?: number })` finds pages connected through:
- Shared connections (pages that link to/from the same pages)
- Shared tags
- Shared properties

**Rationale**: Discovers semantically related content beyond direct links.

### Decision: Orphaned Page Detection
`findOrphanedPages()` returns pages with:
- No backlinks
- No forward links
- No tags (optional filter)

**Rationale**: Helps users discover disconnected content that might need linking.

## Risks / Trade-offs

### Risk: Performance Impact
Graph traversal can be expensive for large graphs.

**Mitigation**: Limit traversal depth, use caching, and return results incrementally.

### Risk: Circular References
Pages might reference each other creating cycles.

**Mitigation**: Track visited pages during traversal to prevent infinite loops.

### Risk: Large Result Sets
Traversal might return many pages.

**Mitigation**: Limit results, provide pagination, and allow filtering by connection strength.

## Open Questions

- Should traversal respect namespace boundaries?
- How to rank/score related pages by relevance?
- Should traversal include block references or only page references?

