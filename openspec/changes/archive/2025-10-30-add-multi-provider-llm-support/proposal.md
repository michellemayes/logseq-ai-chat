## Why

Currently, the application only supports Groq as an LLM provider. Users may want to use other providers like OpenAI, Anthropic, or local models via Ollama for different use cases, cost considerations, or feature requirements. Adding multi-provider support will make the application more flexible and extensible.

## What Changes

- **BREAKING**: Settings schema expanded to support multiple provider types with provider-specific configuration
- Add provider selection UI in settings panel
- Implement provider abstraction layer supporting multiple LLM providers (Groq, OpenAI, Anthropic, Ollama)
- Each provider maintains its own API key, model selection, and endpoint configuration
- Provider-specific settings UI (API keys, models, endpoints)
- Maintain backward compatibility with existing Groq-only installations
- Support provider-specific features (streaming, model lists, API formats)

## Impact

- Affected specs: `llm-integration`, `settings`
- Affected code:
  - `src-electron/store/settings.ts` - Settings type and defaults
  - `src-electron/llm/provider.ts` - Provider interface and implementations
  - `src-electron/ipc/handlers.ts` - Provider initialization
  - `src-electron/types.d.ts` - Type definitions
  - `src/components/SettingsPanel.tsx` - Provider selection UI
  - `src/types.d.ts` - Renderer type definitions

