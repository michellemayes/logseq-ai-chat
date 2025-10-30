## 1. Block ID Indexing
- [ ] 1.1 Add `blockIds: Map<string, { pageName: string; blockIndex: number }>` to GraphIndex interface
- [ ] 1.2 Populate block ID index during `buildIndex` for all blocks with IDs
- [ ] 1.3 Add block ID validation (check for duplicates, log warnings)
- [ ] 1.4 Create `getBlockById(blockId: string)` function in search.ts
- [ ] 1.5 Return block with page context (pageName, blockIndex, parent/sibling blocks)

## 2. Block Query IPC Handlers
- [ ] 2.1 Add `get-block-by-id` IPC handler accepting blockId parameter
- [ ] 2.2 Add `get-block-with-context` IPC handler returning block + parent page info
- [ ] 2.3 Expose block query methods in preload.ts ElectronAPI interface
- [ ] 2.4 Add block query types to types.d.ts

## 3. Block Reference Generation in AI
- [ ] 3.1 Update system prompt to inform AI about block reference capabilities
- [ ] 3.2 Add examples of block reference syntax `((block-id))` to system prompt
- [ ] 3.3 Instruct AI to use block references when referencing specific blocks
- [ ] 3.4 Parse block references from AI responses (regex: `/\(\(([^)]+)\)\)/g`)
- [ ] 3.5 Extract block IDs from AI response text

## 4. Block Reference Rendering in UI
- [ ] 4.1 Detect block references in message content (parse `((block-id))`)
- [ ] 4.2 Render block references as clickable links in MessageBubble
- [ ] 4.3 Style block references differently from regular text
- [ ] 4.4 Add hover tooltip showing block preview/content
- [ ] 4.5 Handle block references in streaming responses

## 5. Block Navigation
- [ ] 5.1 Implement `navigateToBlock(blockId: string)` function
- [ ] 5.2 Query block by ID to get parent page
- [ ] 5.3 Handle navigation to blocks in different pages
- [ ] 5.4 Add block highlighting/navigation animation
- [ ] 5.5 Handle block not found errors gracefully

## 6. Block Reference Context
- [ ] 6.1 Include block IDs in context when blocks are referenced
- [ ] 6.2 Provide block context (parent page, surrounding blocks) to AI
- [ ] 6.3 Add block reference metadata to citations
- [ ] 6.4 Store block references in message metadata

## 7. Testing and Validation
- [ ] 7.1 Unit tests for block ID indexing
- [ ] 7.2 Unit tests for `getBlockById` function
- [ ] 7.3 Unit tests for block reference parsing
- [ ] 7.4 Integration tests for block navigation
- [ ] 7.5 Manual test: AI generates block reference in response
- [ ] 7.6 Manual test: Click block reference navigates to block
- [ ] 7.7 Manual test: Block reference in streaming response
- [ ] 7.8 Manual test: Block not found error handling

