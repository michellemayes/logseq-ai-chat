# Build a LogSeq LLM Chat Interface

## Project Overview
Build an Electron desktop application that provides an AI chat interface integrated with LogSeq. The app should read and write to a local LogSeq graph via direct file system access, allowing users to search their knowledge base, get contextual answers, create journal entries, and manage markdown pages.

## Tech Stack
- **Framework**: Electron (for desktop app with file system access)
- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **LLM Provider**: Groq API (design for easy extensibility to add more providers later)
- **File Parsing**: Read/write markdown files with frontmatter support
- **State Management**: React Context or Zustand (your choice)

## Core Requirements

### 1. File System Integration
- Allow user to configure LogSeq graph directory path (store in app settings)
- Recursively scan directory for `.md` files
- Parse markdown files with YAML frontmatter
- Watch for file changes and update index in real-time
- Support LogSeq's file structure: `/pages/`, `/journals/`, and `/logseq/` directories
- Parse LogSeq-specific syntax:
  - Block references: `((block-id))`
  - Page references: `[[Page Name]]`
  - Tags: `#tag` and `#[[multi-word tag]]`
  - Properties: `property:: value`
  - TODO/DOING/DONE markers
  - Block indentation (tab-based hierarchy)

### 2. LogSeq Graph Analysis
Implement comprehensive graph analysis capabilities:
- **Full-text search** across all pages and blocks
- **Backlinks tracking**: Find all pages that reference a given page
- **Forward links**: Extract all `[[page]]` references from content
- **Block-level operations**: Parse and index individual blocks with their IDs
- **Property extraction**: Read and index all `property:: value` pairs
- **Tag indexing**: Track all tags and their usage
- **Namespace support**: Handle hierarchical pages like `Project/Subproject`
- **Graph traversal**: Get connected pages up to N levels deep
- **Journal parsing**: Specifically handle journal entries with date-based organization

### 3. LLM Integration (Groq)
- Use Groq API with configurable API key (stored securely)
- Default model: `mixtral-8x7b-32768` or `llama-3.1-70b-versatile` (user configurable)
- **Architecture for extensibility**: 
  - Create an abstract `LLMProvider` interface/class
  - Implement `GroqProvider` as first concrete implementation
  - Design so `OpenAIProvider`, `AnthropicProvider`, `OllamaProvider` can be easily added
  - Provider selection in settings UI

### 4. Context Injection System
When user asks a question:
1. Analyze the query to determine relevant search terms
2. Search LogSeq graph for relevant content
3. Retrieve full context including:
   - Matching page content
   - Related blocks
   - Backlinks and forward links
   - Referenced blocks
   - Parent/child block relationships
4. Format context clearly for LLM
5. Include metadata: page names, block IDs, modification dates
6. Send to LLM with system prompt that explains LogSeq context

### 5. Content Creation Features

#### Journal Entries
- Create or append to daily journal (format: `journals/YYYY_MM_DD.md`)
- Use proper LogSeq journal structure based on https://docs.logseq.com/:
  - Date as h1 heading: `# Tuesday, Oct 29th, 2025`
  - Bullets for entries with proper indentation
  - Auto-timestamp blocks if requested
  - Preserve existing content when appending

#### Page Creation
- Create new pages in `/pages/` directory
- Sanitize page names (handle special characters, spaces → underscores)
- Add YAML frontmatter with at least `title` property
- Support LogSeq properties format: `property:: value` lines
- Handle namespace pages (create directory structure if needed)

#### Block Addition & Page Editing
- Append blocks to existing pages with proper indentation
- Maintain LogSeq block structure (bullets, indentation)
- Support adding child blocks
- Allow AI to suggest edits to existing content with user confirmation
- Track block IDs when modifying content

### 6. UI/UX Design

**Design Philosophy**: Simple, professional, seamless companion to LogSeq
- Clean, minimal interface matching LogSeq's aesthetic
- Professional color scheme (neutral grays, subtle accents)
- Typography similar to LogSeq (system fonts, good readability)

**Layout**:
- Single-panel chat interface
- Messages show:
  - User queries
  - AI responses with inline context citations
  - Embedded cards showing where context was retrieved (page name, excerpt, link to open in LogSeq)
- Collapsible sidebar for:
  - Settings (LogSeq path, API key, model selection)
  - Recent conversations
  - Quick actions (New Journal, New Page, Search)

**Context Display**:
- When AI uses LogSeq context, show inline citations like:
  ```
  "According to your note on [[Project Planning]]:
  [Card showing: Project Planning > bullet point excerpt]"
  ```
- Make citations clickable to copy block reference or page name
- Visual distinction between AI's general knowledge vs LogSeq-specific info

**Dark/Light Mode**:
- Toggle switch in header
- Smooth theme transition
- Persist user preference
- Default to system preference on first launch

### 7. Key Features

**Search Functionality**:
- Search bar that queries LogSeq graph
- Show results with context snippets
- Filter by: pages, journals, tags, properties
- Recent pages list

**Smart Context Selection**:
- AI automatically determines what LogSeq content is relevant
- User can manually @mention pages to force inclusion
- Show "Context Used" section in responses (collapsible)

**Actions Menu**:
- "Create Journal Entry" - AI drafts, user reviews, then saves
- "Create New Page" - AI suggests structure, user edits, then saves
- "Add to Page" - Select existing page, AI adds content
- "Search Graph" - Direct search interface

**Settings**:
- LogSeq graph directory path (with file picker)
- Groq API key input (masked)
- Model selection dropdown
- Provider selection (for future extensibility)
- Theme preference
- Auto-save preferences

### 8. Technical Implementation Details

**File Watching**:
- Use `chokidar` or Node's `fs.watch` to monitor LogSeq directory
- Debounce file changes to avoid excessive re-indexing
- Update in-memory index when files change

**Markdown Processing**:
- Use `gray-matter` for frontmatter parsing
- Use `remark` or similar for markdown AST parsing
- Custom parser for LogSeq-specific syntax (block refs, properties)

**Data Structures**:
- In-memory index of all pages/blocks for fast search
- Graph structure (adjacency list) for link relationships
- Inverted index for full-text search
- Consider using SQLite if graph is very large (optional optimization)

**Error Handling**:
- Graceful handling of invalid markdown
- File permission errors
- API rate limits
- Network errors
- User-friendly error messages

**Security**:
- Store API keys in secure electron store
- Never log sensitive data
- File operations should be sandboxed to LogSeq directory

### 9. User Experience Flow

**First Launch**:
1. Welcome screen
2. Prompt to select LogSeq graph directory
3. Prompt for Groq API key
4. Quick tutorial/tips overlay

**Typical Session**:
1. User asks question about their notes
2. App searches graph, finds relevant content
3. Context sent to LLM with clear source attribution
4. Response shows inline citations
5. User can drill into cited sources
6. User can ask follow-up or request actions (create journal, etc.)

**Content Creation Flow**:
1. User: "Create a journal entry about today's meeting"
2. AI drafts entry with proper format
3. Preview shown to user in modal
4. User can edit or approve
5. File written to journals directory
6. Confirmation shown with link to open in LogSeq

## Code Quality Requirements
- TypeScript with strict mode
- Comprehensive error handling
- Clean, modular architecture
- Comments for complex logic
- ESLint + Prettier configuration
- Component-based React structure
- Separation of concerns (UI, business logic, file operations, LLM integration)

## Deliverables
1. Complete Electron app with all features
2. README with:
   - Installation instructions
   - How to get Groq API key
   - How to configure LogSeq path
   - Usage examples
3. Clean project structure
4. Package.json with all scripts (dev, build, package)

## Priority Order
1. File system reading and LogSeq parsing
2. Basic chat UI with Groq integration
3. Context search and injection
4. Journal entry creation
5. Page creation and editing
6. Advanced features (graph visualization, etc.)

Build this as a production-ready application that's fast, reliable, and feels like a natural extension of LogSeq.