## Context

The application currently only supports Groq as an LLM provider. The codebase already has an `LLMProvider` interface, but it's tightly coupled to Groq's API format. We need to extend this to support multiple providers while maintaining a clean abstraction.

## Goals / Non-Goals

### Goals
- Support multiple LLM providers (Groq, OpenAI, Anthropic, Ollama)
- Provider-specific configuration (API keys, models, endpoints)
- Dynamic provider selection without app restart
- Backward compatibility with existing Groq-only installations
- Consistent interface for streaming and non-streaming modes across providers

### Non-Goals
- Provider-specific model fine-tuning UI
- Provider-specific advanced features (function calling, etc.) in initial implementation
- Provider marketplace or dynamic provider loading from external sources
- Multi-provider fallback or load balancing

## Decisions

### Decision: Provider Configuration Structure
Store provider settings as a map keyed by provider ID, with active provider selection:
```typescript
interface Settings {
  provider: 'groq' | 'openai' | 'anthropic' | 'ollama';
  providers: {
    groq: { apiKey: string; model: string };
    openai: { apiKey: string; model: string };
    anthropic: { apiKey: string; model: string };
    ollama: { endpoint: string; model: string };
  };
}
```

**Rationale**: Keeps settings organized, allows users to configure multiple providers, and makes switching straightforward.

### Decision: Provider Interface Extensions
Extend `LLMProvider` interface to include metadata:
```typescript
interface LLMProvider {
  getName(): string;
  getModels(): string[];
  supportsStreaming(): boolean;
  chat(...): Promise<string>;
  chatStream(...): Promise<string>;
}
```

**Rationale**: Enables UI to dynamically show available models and features per provider.

### Decision: System Prompt Extraction
Extract system prompt building into a shared utility function used by all providers.

**Rationale**: Consistency across providers and easier maintenance.

### Decision: Provider-Specific Error Handling
Each provider handles its own API errors and formats error messages consistently.

**Rationale**: Different APIs have different error formats, but users should see consistent error messages.

## Risks / Trade-offs

### Risk: Settings Migration Complexity
**Mitigation**: Create migration function that moves existing `apiKey` and `model` to `providers.groq` structure.

### Risk: Provider API Differences
**Mitigation**: Use adapter pattern for each provider to normalize differences (authentication, endpoints, streaming format).

### Risk: Ollama Local Endpoint Configuration
**Mitigation**: Allow optional endpoint configuration with sensible defaults (http://localhost:11434).

## Migration Plan

1. Add migration function in `settings.ts` to detect old format
2. Move `apiKey` and `model` to `providers.groq` if `provider` is 'groq'
3. Set `provider` to 'groq' if not already set
4. Test migration with existing user data

## Open Questions

- Should we support custom OpenAI-compatible endpoints (for local models)?
- How to handle model deprecation across providers?
- Should provider settings be encrypted separately?

