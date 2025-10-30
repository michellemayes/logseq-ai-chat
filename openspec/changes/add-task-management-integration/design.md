## Context

Logseq blocks can contain task markers (TODO, DOING, DONE, etc.) at the start of block content. Currently, these markers are parsed as part of the block content but not extracted or indexed. This proposal adds task management capabilities by parsing, indexing, and querying these markers.

## Goals / Non-Goals

### Goals
- Parse and index task status markers from blocks
- Enable querying tasks by status, page, or date range
- Allow AI to update task status via chat
- Support temporal queries ("tasks due this week")
- Generate task summaries from journal entries

### Non-Goals
- Task dependencies or project management features
- Custom task statuses beyond Logseq defaults
- Task time tracking or estimation
- Task notifications or reminders

## Decisions

### Decision: Task Status Values
Support Logseq's standard task markers: TODO, DOING, DONE, LATER, NOW, WAITING, CANCELED.

**Rationale**: These are the standard Logseq task markers, ensuring compatibility with existing Logseq graphs.

### Decision: Task Marker Parsing
Extract task markers from block content using regex: `/^-(TODO|DOING|DONE|LATER|NOW|WAITING|CANCELED)\s+(.+)$/` (case-insensitive)

**Rationale**: Logseq format is `- TODO content` or `- DOING content`. The marker appears before the content and is case-insensitive.

### Decision: Task Index Structure
Add to GraphIndex:
```typescript
tasks: Map<TaskStatus, Set<string>> // Maps status to set of page names containing tasks
```

Also track tasks per block in IndexedPage blocks array with `taskStatus?: TaskStatus`.

**Rationale**: Enables fast queries by status while maintaining block-level granularity.

### Decision: Task Status Updates
Update task status by:
1. Finding block by ID in page
2. Replacing task marker in content
3. Writing updated content back to file
4. Re-indexing the page

**Rationale**: Preserves file structure and block relationships while updating task status.

### Decision: Temporal Queries
Parse `scheduled` and `deadline` properties from blocks for temporal queries.

**Rationale**: Logseq uses properties for dates, enabling "tasks due this week" queries.

## Risks / Trade-offs

### Risk: Parsing Ambiguity
Task markers might appear in block content naturally (not as markers).

**Mitigation**: Only parse markers at the start of blocks after bullet point, matching Logseq's format exactly.

### Risk: Performance Impact
Additional indexing might slow down graph building.

**Mitigation**: Task parsing is lightweight regex matching, minimal overhead.

### Risk: File Modification
Updating task status requires file writes, risk of corruption.

**Mitigation**: Use same file write patterns as journal/page creation, with error handling and validation.

## Open Questions

- Should we support custom task statuses beyond Logseq defaults?
- How to handle tasks in nested blocks (child blocks of tasks)?
- Should task updates be undoable?

