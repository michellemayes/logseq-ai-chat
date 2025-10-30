## Context

Logseq blocks have unique IDs (13-character alphanumeric) that enable bidirectional linking via block references `((block-id))`. Currently, the system parses block references but cannot:
- Look up blocks by ID
- Create block references in AI responses
- Navigate to blocks when clicking references

This proposal adds block reference operations to enable these capabilities.

## Goals / Non-Goals

### Goals
- Query blocks by ID across the entire graph
- Generate block references in AI responses
- Navigate to referenced blocks from UI
- Index block IDs for fast lookup

### Non-Goals
- Block reference visualization/graph view
- Block reference editing/deletion
- Block reference validation (checking if referenced blocks exist)
- Block reference analytics

## Decisions

### Decision: Block ID Index Structure
Add to GraphIndex:
```typescript
blockIds: Map<string, { pageName: string; blockIndex: number }>
```

Maps block ID to page name and block index within that page.

**Rationale**: Enables O(1) lookup of blocks by ID, essential for performance.

### Decision: Block Query Function
Create `getBlockById(blockId: string): BlockWithPage | null` that returns:
- The block data
- Parent page name
- Block index in page
- Full block context (parent/sibling blocks)

**Rationale**: Provides complete context for block references.

### Decision: Block Reference Generation
AI can generate block references by:
1. Detecting when AI mentions a specific block
2. Including `((block-id))` syntax in response
3. Parsing block references from AI response
4. Rendering them as clickable links in UI

**Rationale**: Allows AI to create bidirectional links naturally.

### Decision: Block Navigation
Clicking a block reference should:
1. Query the block by ID
2. Open the parent page (if not already open)
3. Scroll to the referenced block
4. Highlight the block briefly

**Rationale**: Provides intuitive navigation to referenced content.

## Risks / Trade-offs

### Risk: Block ID Collisions
Logseq block IDs should be unique, but need to verify.

**Mitigation**: Build index during graph build, log warnings for duplicate IDs.

### Risk: Performance Impact
Indexing all block IDs might slow down graph building.

**Mitigation**: Block ID indexing is lightweight (map insertion), minimal overhead.

### Risk: Stale Block References
If a block is deleted, references become invalid.

**Mitigation**: Handle missing blocks gracefully (show "block not found" message).

## Open Questions

- Should we validate block references before rendering?
- How to handle block references in exported conversations?
- Should block references be clickable in non-streaming messages?

