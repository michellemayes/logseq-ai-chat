## Context

Logseq journals are organized by date (format: `journals/YYYY_MM_DD.md`). Currently, the system can query individual journals but cannot query multiple journals, compare them, or detect patterns over time. This proposal adds temporal intelligence capabilities to leverage the date-based organization of journals.

## Goals / Non-Goals

### Goals
- Query journals by date range (last week, last month, custom range)
- Compare journal entries across dates
- Detect recurring patterns (content, tags, topics)
- Track changes over time
- Answer temporal queries ("what did I write last week?")

### Non-Goals
- Journal analytics/metrics dashboard
- Time-series visualization
- Advanced pattern recognition (ML-based)
- Journal export/import features

## Decisions

### Decision: Date Range Query Format
Support flexible date range queries:
- Relative: "last week", "last month", "last 7 days"
- Absolute: Date range (start date, end date)
- Natural language: Parse from user queries

**Rationale**: Allows intuitive temporal queries while supporting precise date ranges.

### Decision: Journal Comparison Format
Compare journals by:
- Content similarity (shared keywords, topics)
- Tag overlap
- Block count/activity level
- Property presence

**Rationale**: Provides multiple dimensions for comparison based on Logseq structure.

### Decision: Pattern Detection Scope
Detect patterns in:
- Recurring tags across journals
- Recurring topics/keywords
- Recurring block patterns (e.g., daily tasks)
- Temporal patterns (e.g., journals on specific days of week)

**Rationale**: Focuses on structured patterns that are discoverable in Logseq format.

### Decision: Temporal Query Performance
Cache journal dates during indexing for fast date range queries.

**Rationale**: Avoids scanning all files when querying by date range.

## Risks / Trade-offs

### Risk: Performance Impact
Querying many journals could be slow for large date ranges.

**Mitigation**: Limit default date range, use indexing, and support pagination.

### Risk: Pattern Detection Complexity
Pattern detection might be computationally expensive.

**Mitigation**: Use simple keyword/tag matching first, defer complex analysis.

### Risk: Date Parsing Ambiguity
Natural language date parsing might be ambiguous.

**Mitigation**: Use explicit date formats when possible, fall back to natural language parsing.

## Open Questions

- Should pattern detection analyze page content or only journals?
- How to handle timezone differences in date queries?
- Should comparison results be cached?

