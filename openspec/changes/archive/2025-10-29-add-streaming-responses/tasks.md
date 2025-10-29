# Tasks: Add Streaming Responses

## Phase 1: LLM Provider Streaming Support
- [x] 1.1 Extend LLMProvider interface with streaming method
  - Add `chatStream()` method signature
  - Define callback/event emitter pattern for token delivery
- [x] 1.2 Implement Groq streaming in GroqProvider
  - Use Groq API streaming endpoint (`stream: true`)
  - Parse SSE chunks from response
  - Emit tokens as they arrive
  - Handle stream completion and errors
- [x] 1.3 Add stream utility functions
  - Parse SSE format chunks
  - Extract content from Groq response chunks
  - Handle partial JSON/delta content

## Phase 2: IPC Streaming Communication
- [x] 2.1 Add IPC event handlers for streaming
  - `chat-stream-start` event to initiate streaming
  - `chat-stream-token` event for each token
  - `chat-stream-end` event for completion
  - `chat-stream-error` event for errors
- [x] 2.2 Update IPC handler to support streaming
  - Detect streaming vs non-streaming requests
  - Set up event emitter for token stream
  - Forward tokens from LLM provider to renderer
- [x] 2.3 Update preload.ts with streaming API
  - Add `chatStream()` method
  - Set up event listeners for streaming events
  - Provide callback-based API for tokens

## Phase 3: UI Streaming Updates
- [x] 3.1 Update ChatInterface for streaming state
  - Track streaming message state
  - Accumulate tokens as they arrive
  - Handle stream start/end/error events
- [x] 3.2 Update MessageBubble for streaming display
  - Accept streaming prop/state
  - Render partial content as it streams
  - Show cursor/typing indicator during streaming
- [x] 3.3 Replace "Thinking..." with streaming indicator
  - Add animated typing indicator component
  - Show during stream initialization
  - Hide when first token arrives
- [x] 3.4 Handle streaming errors
  - Show error message if stream fails
  - Fallback to non-streaming mode on error
  - Maintain message state consistency

## Phase 4: Parsing & Content Handling
- [x] 4.1 Handle LOGSEQ_ACTION parsing during streaming
  - Accumulate full response before parsing
  - Parse action tags when stream completes
  - Handle partial action tags gracefully
- [x] 4.2 Update citation extraction for streaming
  - Maintain context references during stream
  - Extract citations after stream completes
  - Preserve citation display logic

## Phase 5: Testing & Edge Cases
- [x] 5.1 Test streaming with various response lengths
  - Short responses (< 100 tokens)
  - Medium responses (100-1000 tokens)
  - Long responses (> 1000 tokens)
- [x] 5.2 Test error scenarios
  - Network interruption during stream
  - API errors mid-stream
  - Invalid stream data
- [x] 5.3 Test with different models
  - Verify all Groq models support streaming
  - Test response format consistency
- [x] 5.4 Manual testing
  - Verify smooth streaming experience
  - Check typing indicator appearance
  - Test fallback behavior

