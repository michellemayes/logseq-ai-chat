# LogSeq AI Chat

An Electron desktop application that provides an AI chat interface integrated with LogSeq. Chat with your notes using Groq LLM with automatic context retrieval from your LogSeq knowledge graph.

## Features

- **File System Integration**: Direct access to your LogSeq graph directory
- **Graph Analysis**: Full-text search, backlinks, forward links, tag and property indexing
- **LLM Integration**: Groq API support with extensible provider architecture
- **Context Injection**: Automatic retrieval of relevant content from your notes
- **Content Creation**: Create journal entries and pages with proper LogSeq formatting
- **Modern UI**: Clean chat interface with dark/light theme support and inline citations

## Installation

### Prerequisites

- Node.js 18+ and npm
- A LogSeq graph directory
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

### Setting Up LogSeq Path

1. Open the app
2. Click the settings button (☰) in the header
3. Click "Browse" next to "LogSeq Graph Path"
4. Select your LogSeq graph directory (typically contains `pages/`, `journals/`, and `logseq/` folders)
5. Enter your Groq API key
6. Select your preferred model (default: Mixtral 8x7b)
7. Click "Save Settings"

## Usage

### Basic Chat

1. Ask questions about your notes
2. The app automatically searches your LogSeq graph for relevant content
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
- File operations are restricted to the configured LogSeq directory

## License

MIT

