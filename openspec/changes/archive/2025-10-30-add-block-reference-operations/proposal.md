# Add Block Reference Operations

## Why

Logseq uses block references `((block-id))` to create bidirectional links between blocks, enabling powerful note-taking workflows. Currently, the system parses block references but cannot:
- Query or retrieve specific blocks by ID
- Generate block references in AI responses to link back to source content
- Navigate to referenced blocks when clicking citations
- Create block references when the AI references specific blocks

This limits the app's ability to create rich, interconnected responses that link directly to source blocks in the user's graph.

## What Changes

- Add block-by-ID query functionality to retrieve specific blocks from the graph
- Create block ID index mapping IDs to page names and block metadata
- Enable AI to generate block references `((block-id))` in responses
- Make citations clickable to navigate to referenced blocks
- Add IPC handlers for block query operations
- Enhance LLM system prompt with block reference capabilities
- Add UI support for displaying and navigating block references

## Impact

- **Affected specs**: `graph-analysis` (block querying), `content-creation` (block reference generation), `llm-integration` (block-aware prompts), `ui-ux` (clickable block references)
- **Affected code**:
  - `src-electron/graph/index.ts` - Block ID index mapping
  - `src-electron/graph/search.ts` - Block query functions
  - `src-electron/ipc/handlers.ts` - Block query IPC handlers
  - `src-electron/types.d.ts` - Block query types
  - `src-electron/llm/provider.ts` - Block reference system prompt
  - `src/components/MessageBubble.tsx` - Clickable block reference rendering
  - `src/components/ChatInterface.tsx` - Block navigation handling

