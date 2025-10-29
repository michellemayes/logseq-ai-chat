# Design: Streaming Responses

## Context
The current implementation uses a promise-based approach where the entire LLM response is returned after completion. Users see "Thinking..." and wait for the full response. We need to stream tokens as they arrive from the API to provide immediate feedback.

## Goals / Non-Goals

### Goals
- Stream tokens as they arrive from the LLM API
- Display tokens immediately in the UI
- Show typing indicator during stream initialization
- Maintain backward compatibility with non-streaming mode
- Handle streaming errors gracefully with fallback
- Preserve all existing functionality (action parsing, citations)

### Non-Goals
- Multi-provider streaming (focus on Groq first)
- Streaming for context retrieval (only chat responses)
- Rate limiting or throttling of streams
- Cancellation/abort functionality (can be added later)

## Decisions

### Decision: Use IPC events instead of handle/invoke for streaming
**Why**: IPC `handle()` requires a single Promise return, which doesn't fit streaming. Events allow bidirectional communication - main process can emit tokens, renderer can listen.
**Alternatives considered**:
- WebSockets: Overkill for Electron IPC, adds complexity
- Callback-based IPC: Electron doesn't support callbacks directly, events are the standard pattern
- Keep handle + polling: Too inefficient, defeats purpose of streaming

### Decision: SSE streaming format (Groq API)
**Why**: Groq API uses Server-Sent Events (SSE) format for streaming, which is standard and well-supported.
**Alternatives considered**:
- Custom streaming format: Not necessary, SSE is standard
- WebSocket streaming: Groq doesn't support WebSocket for chat completions

### Decision: Accumulate tokens in UI state, parse after completion
**Why**: LOGSEQ_ACTION parsing requires full response. Accumulating tokens allows parsing to work unchanged.
**Alternatives considered**:
- Parse incrementally: Too complex, action tags may span multiple chunks
- Parse on each token: Inefficient, tags may be incomplete

### Decision: Show typing indicator only before first token
**Why**: Once first token arrives, the streaming content itself is the indicator. Avoids redundant UI elements.
**Alternatives considered**:
- Always show typing indicator: Distracting, redundant with actual content
- No indicator: Confusing during initial wait

### Decision: Fallback to non-streaming on error
**Why**: Maintains reliability - if streaming fails, user still gets response via standard method.
**Alternatives considered**:
- Fail completely: Poor UX, users lose progress
- Retry streaming: Adds complexity, may compound errors

## Architecture

### Data Flow
```
User sends message
  ↓
ChatInterface calls chatStream()
  ↓
IPC event: 'chat-stream-start' emits
  ↓
Main process: GroqProvider.chatStream() called
  ↓
Groq API SSE stream opened
  ↓
For each token chunk:
  Main process parses chunk
  IPC event: 'chat-stream-token' emits with token
  Renderer receives token
  UI updates immediately
  ↓
Stream completes
  IPC event: 'chat-stream-end' emits
  Renderer processes full response (parsing, citations)
```

### IPC Event Structure
```typescript
// Start streaming
ipcMain.on('chat-stream-start', (event, { messages, context }) => {
  // Initiate stream
});

// Token received
ipcMain.on('chat-stream-token', (event, token: string) => {
  // Update UI
});

// Stream complete
ipcMain.on('chat-stream-end', (event, fullResponse: string) => {
  // Finalize message
});

// Stream error
ipcMain.on('chat-stream-error', (event, error: Error) => {
  // Handle error, fallback
});
```

### LLM Provider Interface
```typescript
interface LLMProvider {
  chat(...): Promise<string>;  // Existing
  chatStream(
    messages: Array<{ role: string; content: string }>,
    context?: Array<...>,
    onToken: (token: string) => void
  ): Promise<string>;  // Returns full response after stream
}
```

## Risks / Trade-offs

### Risk: Parsing LOGSEQ_ACTION from incomplete stream
**Mitigation**: 
- Accumulate full response before parsing
- Parse only after stream completes
- Handle partial tags gracefully

### Risk: IPC event overhead
**Mitigation**:
- Batch small tokens if needed (though unlikely to be an issue)
- Monitor performance impact
- Consider batching multiple tokens per event if needed

### Risk: Stream errors mid-conversation
**Mitigation**:
- Catch errors at each stage
- Emit error event to renderer
- Fallback to non-streaming mode automatically
- Show user-friendly error message

### Risk: Memory usage with very long streams
**Mitigation**:
- Stream tokens directly to UI (don't accumulate unnecessarily)
- Only accumulate full response for parsing
- Monitor memory usage

## Implementation Notes

### Groq API Streaming Format
Groq API returns SSE format:
```
data: {"id":"...","object":"chat.completion.chunk","created":123,"model":"...","choices":[{"index":0,"delta":{"content":"token"},"finish_reason":null}]}

data: [DONE]
```

We need to:
1. Parse `data:` lines
2. Extract `choices[0].delta.content`
3. Handle `[DONE]` signal
4. Accumulate tokens for full response

### UI Update Pattern
```typescript
const [streamingContent, setStreamingContent] = useState('');
const [isStreaming, setIsStreaming] = useState(false);

// On token
onTokenReceived((token) => {
  setStreamingContent(prev => prev + token);
});

// On complete
onStreamComplete((fullResponse) => {
  setIsStreaming(false);
  // Process full response for actions/citations
});
```

## Migration Plan

### Phase 1: Add streaming without breaking existing
- Add streaming methods alongside existing
- Keep non-streaming as default
- Feature flag or gradual rollout

### Phase 2: Make streaming default
- Update ChatInterface to use streaming by default
- Keep non-streaming as fallback

### Phase 3: Remove non-streaming (optional)
- If streaming is reliable, can remove fallback later
- Or keep as fallback permanently for reliability

## Open Questions

- Should we batch tokens for IPC events (e.g., emit every N tokens)?
- Should we add stream cancellation/abort functionality?
- Should typing indicator be configurable (user preference)?

