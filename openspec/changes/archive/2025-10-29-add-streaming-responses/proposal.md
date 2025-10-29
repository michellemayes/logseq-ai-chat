# Add Streaming Responses

## Why
Currently, users must wait for the entire LLM response to complete before seeing any output. This creates a poor user experience:
- Long wait times before seeing any feedback
- No indication of progress during generation
- Perceived slowness even when total time is reasonable
- Users may cancel requests thinking nothing is happening

Streaming responses will provide immediate feedback as tokens arrive, significantly improving perceived performance and user engagement.

## What Changes
- Add streaming support to LLM provider interface
- Implement Server-Sent Events (SSE) streaming for Groq API
- Update IPC communication to use events instead of handle/invoke for streaming
- Update UI to display tokens as they arrive in real-time
- Replace "Thinking..." indicator with streaming animation
- Handle streaming errors gracefully with fallback to non-streaming mode
- Maintain backward compatibility with existing non-streaming API

## Impact
- **Affected specs**: `llm-integration` (streaming support), `ui-ux` (streaming UI updates)
- **Affected code**: 
  - `src-electron/llm/provider.ts` (streaming implementation)
  - `src-electron/ipc/handlers.ts` (IPC events for streaming)
  - `src-electron/preload.ts` (streaming API exposure)
  - `src/components/ChatInterface.tsx` (streaming state management)
  - `src/components/MessageBubble.tsx` (streaming content display)
  - `src/components/MessageList.tsx` (typing indicator)

