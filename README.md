# Logseq AI Chat

An Electron desktop application that provides an AI chat interface integrated with Logseq. Chat with your notes using Groq LLM with automatic context retrieval from your Logseq knowledge graph.

## Features

- **File System Integration**: Direct access to your Logseq graph directory
- **Graph Analysis**: Full-text search, backlinks, forward links, tag and property indexing
- **LLM Integration**: Groq API support with extensible provider architecture
- **Context Injection**: Automatic retrieval of relevant content from your notes
- **Content Creation**: Create journal entries and pages with proper Logseq formatting
- **Modern UI**: Clean chat interface with dark/light theme support and inline citations

## Installation

### Prerequisites

- Node.js 18+ and npm
- A Logseq graph directory
- Groq API key ([Get one here](https://console.groq.com/))

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

### Setting Up Logseq Path

1. Open the app
2. Click the settings button in the header
3. Click "Browse" next to "Logseq Graph Path"
4. Select your Logseq graph directory (typically contains `pages/`, `journals/`, and `logseq/` folders)
5. Enter your Groq API key
6. Select your preferred model
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
3. AI responses include citations showing which pages/blocks were referenced
4. Click on citations to see excerpts from source content

### Creating Content

#### Journal Entries
Ask the AI: "Create a journal entry about today's meeting with notes about X, Y, Z"

#### Pages
Ask the AI: "Create a page called 'Project Ideas' with content about..."

#### Appending to Pages
Ask the AI: "Add a bullet point to the 'Project Ideas' page about..."

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
│   └── store/             # Settings storage
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
- **Groq API** - LLM provider
- **gray-matter** - Frontmatter parsing
- **chokidar** - File watching
- **electron-store** - Settings persistence

## Security

- API keys are stored securely using `electron-store`
- No sensitive data is logged
- File operations are restricted to the configured Logseq directory

## License

MIT

