# Intelligent Context Access

## Why
Currently, the system includes all blocks from matched pages/journals in context, includes top 5 search results regardless of relevance, and has no configurable limits. This leads to:
- Excessive context being sent to the LLM (wasting tokens and cost)
- Irrelevant content diluting the AI's responses
- No way for users to control context selection based on their needs
- Performance issues with large graphs

Users need intelligent, configurable context filtering to ensure only relevant content is included while maintaining flexibility for different use cases.

## What Changes
- Add configurable context limits (max pages, blocks per page, total blocks)
- Implement block-level relevance filtering within pages
- Add relevance threshold for search results
- Support filtering by namespace, tags, and date ranges
- Provide settings UI for context configuration
- Enhance search scoring to support better filtering
- Add context summarization for large pages when limits are exceeded

## Impact
- **Affected specs**: `context-injection` (context assembly logic), `settings` (new context settings), `graph-analysis` (enhanced search/scoring)
- **Affected code**: 
  - `src/components/ChatInterface.tsx` (context building logic)
  - `src-electron/graph/search.ts` (search scoring and filtering)
  - `src-electron/store/settings.ts` (new settings)
  - `src/components/SettingsPanel.tsx` (UI for context settings)
  - `src-electron/llm/provider.ts` (context formatting with limits)

