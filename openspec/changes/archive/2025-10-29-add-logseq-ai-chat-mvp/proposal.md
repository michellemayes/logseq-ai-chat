## Why
The project needs an initial, minimal but functional MVP to enable AI-assisted chat over a local Logseq graph, grounded in the technical requirements.

## What Changes
- Add core capabilities for file system integration and Logseq parsing
- Add LLM integration via Groq with a provider abstraction
- Add context search and injection workflow from Logseq graph to LLM
- Add content creation flows for journals and pages
- Add a minimal chat UI with settings, theme, and citations UX
- Add security and error-handling requirements for keys and file operations

## Impact
- Affected specs: `filesystem-integration`, `graph-analysis`, `llm-integration`, `context-injection`, `content-creation`, `ui-ux`, `settings`, `security`
- Affected code: Electron app shell, React UI, filesystem/indexing module, providers layer, context assembly pipeline, content writers

