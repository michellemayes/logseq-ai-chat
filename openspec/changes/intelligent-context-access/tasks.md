# Tasks: Intelligent Context Access

## Phase 1: Settings Infrastructure
1. Extend `Settings` interface in `src-electron/types.d.ts` and `src/types.d.ts` with optional `contextSettings` object
   - Add `maxPages?: number`
   - Add `maxBlocksPerPage?: number`
   - Add `maxTotalBlocks?: number`
   - Add `searchResultLimit?: number`
   - Add `relevanceThreshold?: number`
   - Add `includeBlocks?: 'all' | 'matched' | 'top'`
   - Add `excludeNamespaces?: string[]`
   - Add `dateRangeDays?: number`
2. Update `src-electron/store/settings.ts` with default context settings
   - Default: `{ maxPages: 5, maxBlocksPerPage: 50, maxTotalBlocks: 100, searchResultLimit: 5, relevanceThreshold: 1, includeBlocks: 'all' }`
3. Add settings UI section in `src/components/SettingsPanel.tsx`
   - Collapsible "Context Settings" section
   - Number inputs for limits with labels and tooltips
   - Dropdown for `includeBlocks` mode
   - Tag input for `excludeNamespaces` (optional)

## Phase 2: Enhanced Search and Filtering
4. Enhance `searchGraph()` in `src-electron/graph/search.ts` to support relevance threshold filtering
   - Filter results by `relevanceThreshold` before returning
   - Respect `searchResultLimit` config
5. Add block-level relevance scoring function
   - Score blocks based on keyword matches in content
   - Return sorted blocks with scores
6. Implement block filtering logic in `ChatInterface.tsx`
   - Filter blocks by mode: 'all', 'matched', or 'top'
   - Apply `maxBlocksPerPage` limit
   - Apply `maxTotalBlocks` limit across all context

## Phase 3: Context Assembly Logic
7. Refactor context building in `ChatInterface.tsx` to respect limits
   - Track total blocks count
   - Stop adding pages when `maxPages` reached
   - Stop adding blocks when `maxTotalBlocks` reached
   - Apply namespace filtering (exclude pages in `excludeNamespaces`)
   - Apply date range filtering for journals (if `dateRangeDays` set)
8. Enhance search result integration
   - Apply relevance threshold to search results
   - Limit to `searchResultLimit` items
   - Score and filter blocks within search results

## Phase 4: Testing and Validation
9. Add unit tests for block filtering logic
   - Test 'all' mode includes all blocks
   - Test 'matched' mode filters correctly
   - Test 'top' mode returns highest scoring blocks
10. Add integration tests for context assembly
    - Test limits are respected
    - Test namespace exclusion works
    - Test date range filtering for journals
11. Test with various graph sizes
    - Small graph (< 10 pages)
    - Medium graph (10-100 pages)
    - Large graph (> 100 pages)

## Phase 5: Documentation and UX
12. Add tooltips/help text in settings UI explaining each option
13. Update README with context configuration documentation
14. Add console logging for context assembly (debug mode)
    - Log when limits are reached
    - Log filtering decisions

