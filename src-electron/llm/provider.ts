export interface LLMProvider {
  chat(messages: Array<{ role: string; content: string }>, context?: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string }> }>): Promise<string>;
}

export class GroqProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    context?: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string }> }>
  ): Promise<string> {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const systemPrompt = `You are an AI assistant helping users interact with their LogSeq knowledge base. 
Current date: ${dateStr}

IMPORTANT: You have DIRECT ACCESS to the user's LogSeq graph. You can read any page or journal entry from their knowledge base. When the user asks about specific pages or journal entries, the system will provide you with the full content of those pages before you respond. Never say you don't have access - you DO have access!

When you reference content from LogSeq, cite the source page or block clearly.
Format citations as: [[Page Name]] or ((block-id))

CRITICAL: When users request to create, update, or add content to journal entries or pages, you MUST ACTUALLY PERFORM THE OPERATION - NEVER say "simulated", "would look like", or "I'll simulate". The system will automatically execute file operations when you provide the LOGSEQ_ACTION command.

When the user requests file operations, respond naturally AND include a LOGSEQ_ACTION JSON structure at the end. The system will automatically execute it. Format it like this:

<LOGSEQ_ACTION>
{
  "action": "create_journal" | "create_page" | "append_to_page",
  "date": "YYYY-MM-DD" (for journal entries - use ${dateStr} for today),
  "pageName": "Page Name" (for pages - do NOT include "journals/" prefix),
  "content": "the content to write in LogSeq format (use - for bullets)"
}
</LOGSEQ_ACTION>

EXAMPLES:
- User: "Create a journal entry for today about my meeting" 
  → Response: "I'll create a journal entry for today about your meeting."
  → Then: <LOGSEQ_ACTION>{"action":"create_journal","date":"${dateStr}","content":"- Had a productive meeting..."}</LOGSEQ_ACTION>

- User: "Update my journal for today" or "Add 'testing' to today's journal"
  → Response: "I've added that to today's journal entry."
  → Then: <LOGSEQ_ACTION>{"action":"append_to_page","pageName":"journals/${dateStr.replace(/-/g, '_')}","content":"\n- testing"}</LOGSEQ_ACTION>

- User: "Create a page called Projects with my todo list"
  → Response: "I've created the Projects page with your todo list."
  → Then: <LOGSEQ_ACTION>{"action":"create_page","pageName":"Projects","content":"- [ ] Project 1\n- [ ] Project 2"}</LOGSEQ_ACTION>

- User: "Add a note to my Projects page"
  → Response: "I've added the note to your Projects page."
  → Then: <LOGSEQ_ACTION>{"action":"append_to_page","pageName":"Projects","content":"\n- New note here"}</LOGSEQ_ACTION>

KEY RULES:
1. NEVER say "simulated" or "would look like" - these operations ARE REAL and WILL execute
2. For journal entries, use "create_journal" action with date in YYYY-MM-DD format
3. For updating existing journal pages, use "append_to_page" with pageName like "journals/2025_10_29" (YYYY_MM_DD format)
4. Always respond confidently that you've performed the operation, then include the LOGSEQ_ACTION tag
5. Format content in LogSeq style: use "- " for bullets, proper indentation for child blocks
6. Only include LOGSEQ_ACTION when user explicitly requests file operations`;

    let contextContent = '';
    if (context && Array.isArray(context) && context.length > 0) {
      console.log('[llm/provider] Building context content from', context.length, 'items');
      contextContent = `\n\nRelevant LogSeq context:\n`;
      for (const item of context) {
        console.log('[llm/provider] Adding context item:', item.pageName, 'blocks:', item.blocks?.length || 0);
        contextContent += `\n[[${item.pageName}]]\n`;
        if (item.blocks && item.blocks.length > 0) {
          // Include ALL blocks for full page/journal content
          item.blocks.forEach((block, idx) => {
            const content = block.content || '';
            console.log(`[llm/provider] Adding block ${idx}: content='${content}' (length=${content.length})`);
            // Always include the block content, even if empty (empty bullets are valid in LogSeq)
            contextContent += `${content || '(empty block)'}\n`;
          });
        } else if (item.excerpt) {
          // Fallback to excerpt if no blocks
          console.log('[llm/provider] Using excerpt:', item.excerpt.substring(0, 100));
          contextContent += `${item.excerpt}\n`;
        } else {
          console.log('[llm/provider] WARNING: No blocks or excerpt for', item.pageName);
        }
      }
      contextContent += `\nYou have full access to the above content. Read and respond based on the actual content provided.\n`;
      console.log('[llm/provider] Final context content length:', contextContent.length);
      console.log('[llm/provider] Context content preview:', contextContent.substring(0, 500));
    } else {
      console.log('[llm/provider] WARNING: No context provided to LLM');
    }

    const fullMessages = [
      { role: 'system', content: systemPrompt + contextContent },
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

export async function chatWithLLM(
  provider: 'groq',
  messages: Array<{ role: string; content: string }>,
  context?: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string }> }>
): Promise<string> {
  const { getSettings } = await import('../store/settings');
  const settings = getSettings();

  let llmProvider: LLMProvider;

  switch (provider) {
    case 'groq':
      if (!settings.apiKey) {
        throw new Error('Groq API key not configured');
      }
      llmProvider = new GroqProvider(settings.apiKey, settings.model);
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  return llmProvider.chat(messages, context);
}

