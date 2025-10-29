## Context
Electron + React desktop app integrating with local LogSeq graph. MVP targets local FS parsing, in-memory indexing, Groq-based chat with contextual citations, and basic content creation flows.

## Goals / Non-Goals
- Goals: Minimal, reliable MVP per TECH_SPEC priority order. Extensible provider design.
- Non-Goals: Multi-provider implementation beyond Groq, graph visualization, SQLite persistence.

## Decisions
- Use in-memory indexes (adjacency lists, inverted index) for speed and simplicity.
- Abstract LLM provider behind `LLMProvider` interface; implement `GroqProvider` first.
- Package context with page/block excerpts and metadata for reproducible citations.

## Risks / Trade-offs
- Large graphs may stress memory → mitigation: debounce watchers, optional limits.
- Markdown edge cases in LogSeq syntax → mitigation: robust parsing and tests.

## Migration Plan
Ship MVP capabilities incrementally behind tasks; expand providers and persistence later.

## Open Questions
- Do we need SQLite for very large graphs in MVP? (assume no for now)

