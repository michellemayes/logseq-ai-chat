## 1. Provider Abstraction Layer
- [ ] 1.1 Refactor `LLMProvider` interface to support provider metadata (name, models, features)
- [ ] 1.2 Create provider registry system for dynamic provider loading
- [ ] 1.3 Extract common system prompt building logic
- [ ] 1.4 Create `OpenAIProvider` implementation
- [ ] 1.5 Create `AnthropicProvider` implementation  
- [ ] 1.6 Create `OllamaProvider` implementation
- [ ] 1.7 Refactor `GroqProvider` to match new interface patterns

## 2. Settings Schema and Storage
- [ ] 2.1 Update `Settings` type to support multiple providers
- [ ] 2.2 Add provider-specific settings structure (API keys, models, endpoints)
- [ ] 2.3 Implement settings migration for existing Groq-only installations
- [ ] 2.4 Add provider validation and default values
- [ ] 2.5 Update settings store to handle provider switching

## 3. Settings UI
- [ ] 3.1 Add provider dropdown/selection in settings panel
- [ ] 3.2 Create dynamic settings form based on selected provider
- [ ] 3.3 Add provider-specific API key fields
- [ ] 3.4 Add provider-specific model selection dropdowns
- [ ] 3.5 Add provider-specific endpoint configuration (for Ollama)
- [ ] 3.6 Update UI labels from "Groq API Key" to provider-agnostic labels

## 4. IPC and Handler Updates
- [ ] 4.1 Update `chatWithLLM` to accept provider from settings
- [ ] 4.2 Refactor provider initialization in IPC handlers
- [ ] 4.3 Update streaming handler to use selected provider
- [ ] 4.4 Add provider validation before LLM calls
- [ ] 4.5 Handle provider-specific error messages

## 5. Testing and Validation
- [ ] 5.1 Test provider switching without restart
- [ ] 5.2 Test settings migration for existing users
- [ ] 5.3 Test each provider implementation (Groq, OpenAI, Anthropic, Ollama)
- [ ] 5.4 Test streaming with each provider
- [ ] 5.5 Test error handling for invalid provider configuration
- [ ] 5.6 Verify backward compatibility with existing Groq settings

