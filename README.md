# Logseq AI Chat

An Electron desktop application that provides an AI chat interface integrated with Logseq. Chat with your notes using multiple LLM providers (Groq, OpenAI, Anthropic, and Ollama) with automatic context retrieval from your Logseq knowledge graph.

## Features

- **File System Integration**: Direct access to your Logseq graph directory
- **Graph Analysis**: Full-text search, backlinks, forward links, tag and property indexing
- **LLM Integration (Multi-Provider)**: Groq, OpenAI, Anthropic, and Ollama with streaming
- **Context Injection**: Automatic retrieval of relevant content from your notes with configurable filtering
- **Content Creation**: Create journal entries and pages with proper Logseq formatting
- **Conversation History**: Save and resume conversations locally with search and export
- **Streaming Responses**: Real-time token streaming for faster perceived response time
- **Modern UI**: Clean chat interface with dark/light theme support, inline citations, and conversation management
- **Block References**: The AI can reference specific blocks using `((block-id))`, with clickable previews
- **Temporal Intelligence**: Query journals by date ranges (e.g., "last week"), compare journals, detect patterns
- **Task Management**: Parse and query TODO/DOING/DONE, update task status via chat, summaries per journal
- **Copy to Clipboard**: One-click copy for each AI message
- **Timestamps**: Local date/time per message (assistant bottom-left, user bottom-right)
- **Collapsible Sources**: Sources are collapsed by default, expandable on click
- **Custom Primary Color**: Change the accent color in Settings; applied app-wide
- **Robust File Ops**: Execute multiple create/update actions in one LLM response

## Installation

### Prerequisites

- Node.js 18+ and npm
- A Logseq graph directory
- Credentials for your chosen LLM provider (configure in Settings → Provider):
  - Groq API key ([Get one here](https://console.groq.com/))
  - OpenAI API key
  - Anthropic API key
  - Ollama endpoint (e.g., http://localhost:11434) and model

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd logseq-ai-chat
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Development

Run in development mode:
```bash
npm run dev
```

This starts both the Electron main process and the React development server.

## Configuration

### Getting a Groq API Key

1. Sign up at [Groq Console](https://console.groq.com/)
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (it won't be shown again)

### Setting Up & Providers

1. Open the app
2. Click the settings button in the header
3. Click "Browse" next to "Logseq Graph Path"
4. Select your Logseq graph directory (typically contains `pages/`, `journals/`, and `logseq/` folders)
5. Select your provider (Groq, OpenAI, Anthropic, Ollama)
6. Enter the API key or endpoint as required, and select a model
7. Click "Save Settings"

### Context Configuration

The app includes intelligent context filtering to control how much content is included in AI responses. Configure these settings in the Settings panel under "Context Settings":

- **Max Pages**: Maximum number of pages to include in context (default: 5)
- **Max Blocks Per Page**: Maximum blocks to include per page (default: 50)
- **Max Total Blocks**: Maximum total blocks across all context (default: 100)
- **Search Result Limit**: Maximum search results to include (default: 5)
- **Relevance Threshold**: Minimum relevance score to include results (default: 1)
- **Block Filtering Mode**: 
  - `all`: Include all blocks from matched pages
  - `matched`: Only include blocks containing query keywords
  - `top`: Include only top-scoring blocks by relevance
- **Exclude Namespaces**: Comma-separated list of namespaces to exclude (e.g., "archive, templates")
- **Date Range (days)**: Only include journals within this many days (leave empty for all journals)

These settings help balance token usage, cost, and response quality. Use stricter limits for faster responses and lower costs, or relax them for more comprehensive context.

## Usage

### Basic Chat

1. Ask questions about your notes
2. The app automatically searches your Logseq graph for relevant content
3. AI responses are streamed in real-time as tokens arrive
4. Responses include citations showing which pages/blocks were referenced (collapsed by default)
5. Click on citations to see excerpts from source content
6. Click the copy icon on any assistant message to copy the full message
7. Message timestamps are shown under each bubble in your local timezone

### Conversation Management

- **Create New Conversation**: Click the conversations icon in the header, then click "+ New Conversation"
- **Resume Previous Conversation**: Open conversations panel and click on any conversation
- **Search Conversations**: Type in the search box to find conversations by title or content
- **Rename Conversations**: Double-click a conversation title to rename it
- **Delete Conversations**: Hover over a conversation and click the trash icon
- **Export Conversations**: Hover over a conversation and click the export icon to save as markdown (includes message timestamps)

### Creating Content

#### Journal Entries
Ask the AI: "Create a journal entry about today's meeting with notes about X, Y, Z"

#### Pages
Ask the AI: "Create a page called 'Project Ideas' with content about..."

#### Appending to Pages
Ask the AI: "Add a bullet point to the 'Project Ideas' page about..."

### Block References
- The AI may include block references using `((block-id))`
- In the chat, block references are clickable and show a hover preview
- Clicking navigates to the source file in your Logseq graph

### Tasks & Temporal Queries
- Ask for TODO/DOING/DONE items, or "tasks due this week"
- Mark tasks as DONE via chat; updates your markdown files
- Ask temporal questions like "what did I write last week?" or compare journals

## Project Structure

```
logseq-ai-chat/
├── src/                    # React frontend
│   ├── components/        # UI components
│   ├── contexts/          # React contexts
│   └── ...
├── src-electron/          # Electron main process
│   ├── filesystem/        # File operations
│   ├── graph/             # Graph indexing and search
│   ├── llm/               # LLM provider integration
│   ├── ipc/               # IPC handlers
│   └── store/             # Settings and conversation storage
└── openspec/              # OpenSpec specifications
```

## Scripts

- `npm run dev` - Start development mode
- `npm run build` - Build for production
- `npm run package` - Package as distributable
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Tech Stack

- **Electron** - Desktop app framework
- **React + TypeScript** - Frontend UI
- **Groq API** - LLM provider (with multi-provider architecture planned)
- **gray-matter** - Frontmatter parsing
- **chokidar** - File watching
- **electron-store** - Settings and conversation persistence

## Roadmap

- **Multi-Provider LLM Support**: Add support for OpenAI, Anthropic, and Ollama providers
- **Conversation Export**: Export conversations to various formats (already supports markdown)
- **Enhanced Search**: Advanced conversation search with filters and date ranges

## Security

- API keys are stored securely using `electron-store`
- No sensitive data is logged
- File operations are restricted to the configured Logseq directory
- Conversations are stored locally and never transmitted

## License

MIT

