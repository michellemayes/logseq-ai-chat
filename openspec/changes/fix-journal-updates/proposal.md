## Why
Journal update operations are not executing when users request updates to existing journal entries. The AI response parsing and file operation execution flow needs to be validated and fixed to ensure journal updates actually write to files.

## What Changes
- Fix AI prompt to correctly specify journal date format for append operations
- Add validation and error handling for journal update operations
- Improve logging to debug when journal updates fail
- Ensure date format consistency between prompt examples and handler expectations
- Add explicit error feedback when journal updates cannot be completed

## Impact
- Affected specs: `content-creation` (specifically journal update scenarios)
- Affected code: `src-electron/llm/provider.ts` (prompt), `src-electron/ipc/handlers.ts` (append handler), `src/components/ChatInterface.tsx` (action execution)

