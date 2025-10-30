import { buildSystemPrompt } from './systemPrompt';

export interface ProviderMetadata {
  name: string;
  models: string[];
  supportsStreaming: boolean;
}

export interface LLMProvider {
  getName(): string;
  getModels(): string[];
  supportsStreaming(): boolean;
  chat(messages: Array<{ role: string; content: string }>, context?: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }>): Promise<string>;
  chatStream(
    messages: Array<{ role: string; content: string }>,
    context: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }> | undefined,
    onToken: (token: string) => void
  ): Promise<string>;
}

export class GroqProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private static readonly MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'mistral-saba-24b',
    'mixtral-8x7b-32768',
  ];

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  getName(): string {
    return 'groq';
  }

  getModels(): string[] {
    return GroqProvider.MODELS;
  }

  supportsStreaming(): boolean {
    return true;
  }

  async chatStream(
    messages: Array<{ role: string; content: string }>,
    context: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }> | undefined,
    onToken: (token: string) => void
  ): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: fullMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Groq API error: ${JSON.stringify(error)}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return fullContent;
            }

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onToken(content);
              }
            } catch (e) {
              console.error('[llm/provider] Failed to parse SSE chunk:', e);
            }
          }
        }
      }

      // Handle remaining buffer
      if (buffer.trim()) {
        if (buffer.startsWith('data: ')) {
          const data = buffer.slice(6);
          if (data !== '[DONE]') {
            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onToken(content);
              }
            } catch (e) {
              console.error('[llm/provider] Failed to parse final SSE chunk:', e);
            }
          }
        }
      }

      return fullContent;
    } catch (error) {
      console.error('[llm/provider] Streaming error:', error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    context?: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }>
  ): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: fullMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Groq API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

export type ProviderType = 'groq' | 'openai' | 'anthropic' | 'ollama';

export function createProvider(providerType: ProviderType, config: { apiKey?: string; model?: string; endpoint?: string }): LLMProvider {
  switch (providerType) {
    case 'groq':
      if (!config.apiKey) {
        throw new Error('Groq API key not configured');
      }
      return new GroqProvider(config.apiKey, config.model || 'llama-3.3-70b-versatile');
    case 'openai':
      if (!config.apiKey) {
        throw new Error('OpenAI API key not configured');
      }
      return new OpenAIProvider(config.apiKey, config.model || 'gpt-4');
    case 'anthropic':
      if (!config.apiKey) {
        throw new Error('Anthropic API key not configured');
      }
      return new AnthropicProvider(config.apiKey, config.model || 'claude-3-opus-20240229');
    case 'ollama':
      return new OllamaProvider(config.endpoint || 'http://localhost:11434', config.model || 'llama2');
    default:
      throw new Error(`Unsupported provider: ${providerType}`);
  }
}

export async function chatWithLLM(
  provider: ProviderType,
  messages: Array<{ role: string; content: string }>,
  context?: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }>
): Promise<string> {
  const { getSettings } = await import('../store/settings');
  const settings = getSettings();

  const providerConfig = settings.providers?.[provider];
  if (!providerConfig) {
    throw new Error(`Provider ${provider} not configured`);
  }

  const llmProvider = createProvider(provider, providerConfig);
  return llmProvider.chat(messages, context);
}

// OpenAI Provider Implementation
class OpenAIProvider implements LLMProvider {
  constructor(private apiKey: string, private model: string) {}
  
  getName(): string { return 'openai'; }
  getModels(): string[] { return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']; }
  supportsStreaming(): boolean { return true; }
  
  async chat(
    messages: Array<{ role: string; content: string }>,
    context?: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }>
  ): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: fullMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async chatStream(
    messages: Array<{ role: string; content: string }>,
    context: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }> | undefined,
    onToken: (token: string) => void
  ): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: fullMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return fullContent;
            }

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onToken(content);
              }
            } catch (e) {
              console.error('[llm/provider] Failed to parse SSE chunk:', e);
            }
          }
        }
      }

      if (buffer.trim()) {
        if (buffer.startsWith('data: ')) {
          const data = buffer.slice(6);
          if (data !== '[DONE]') {
            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onToken(content);
              }
            } catch (e) {
              console.error('[llm/provider] Failed to parse final SSE chunk:', e);
            }
          }
        }
      }

      return fullContent;
    } catch (error) {
      console.error('[llm/provider] Streaming error:', error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }
}

// Anthropic Provider Implementation
class AnthropicProvider implements LLMProvider {
  constructor(private apiKey: string, private model: string) {}
  
  getName(): string { return 'anthropic'; }
  getModels(): string[] { return ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']; }
  supportsStreaming(): boolean { return true; }
  
  async chat(
    messages: Array<{ role: string; content: string }>,
    context?: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }>
  ): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);
    // Anthropic requires system message separate and messages array
    const anthropicMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Anthropic API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }

  async chatStream(
    messages: Array<{ role: string; content: string }>,
    context: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }> | undefined,
    onToken: (token: string) => void
  ): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);
    const anthropicMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: anthropicMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Anthropic API error: ${JSON.stringify(error)}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const json = JSON.parse(data);
              if (json.type === 'content_block_delta' && json.delta?.text) {
                fullContent += json.delta.text;
                onToken(json.delta.text);
              } else if (json.type === 'message_stop') {
                return fullContent;
              }
            } catch (e) {
              console.error('[llm/provider] Failed to parse SSE chunk:', e);
            }
          }
        }
      }

      return fullContent;
    } catch (error) {
      console.error('[llm/provider] Streaming error:', error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }
}

// Ollama Provider Implementation
class OllamaProvider implements LLMProvider {
  constructor(private endpoint: string, private model: string) {}
  
  getName(): string { return 'ollama'; }
  getModels(): string[] { return ['llama2', 'mistral', 'codellama']; }
  supportsStreaming(): boolean { return true; }
  
  async chat(
    messages: Array<{ role: string; content: string }>,
    context?: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }>
  ): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: fullMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Ollama API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  }

  async chatStream(
    messages: Array<{ role: string; content: string }>,
    context: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }> | undefined,
    onToken: (token: string) => void
  ): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: fullMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Ollama API error: ${JSON.stringify(error)}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              fullContent += json.message.content;
              onToken(json.message.content);
            } else if (json.done) {
              return fullContent;
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }

      return fullContent;
    } catch (error) {
      console.error('[llm/provider] Streaming error:', error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }
}

