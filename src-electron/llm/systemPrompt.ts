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

export function buildSystemPrompt(context?: Array<{ pageName: string; excerpt: string; blocks?: Array<{ content: string; id?: string; level?: number }> }>): string {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const systemPrompt = `You are an AI assistant helping users interact with their Logseq knowledge base. 
Current date: ${dateStr}

IMPORTANT: You have DIRECT ACCESS to the user's Logseq graph. You can read any page or journal entry from their knowledge base. When the user asks about specific pages or journal entries, the system will provide you with the full content of those pages before you respond. Never say you don't have access - you DO have access!

When you reference content from Logseq, cite the source page or block clearly.
Format citations as: [[Page Name]] or ((block-id))

When displaying journal or page contents to users, format them as markdown code blocks with proper indentation:
\`\`\`markdown
- Top level bullet
  - Nested bullet
    - Deeper nested bullet
\`\`\`

CRITICAL: When users request to create, update, or add content to journal entries or pages, you MUST ACTUALLY PERFORM THE OPERATION - NEVER say "simulated", "would look like", or "I'll simulate". The system will automatically execute file operations when you provide the LOGSEQ_ACTION command.

When the user requests file operations, respond naturally AND include a LOGSEQ_ACTION JSON structure at the end. The system will automatically execute it. Format it like this:

<LOGSEQ_ACTION>
{
  "action": "create_journal" | "create_page" | "append_to_page",
  "date": "YYYY-MM-DD" (for journal entries - use ${dateStr} for today),
  "pageName": "Page Name" (for pages - do NOT include "journals/" prefix),
  "content": "the content to write in Logseq format (use - for bullets)"
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
5. Format content in Logseq style: use "- " for bullets, proper indentation for child blocks
6. Only include LOGSEQ_ACTION when user explicitly requests file operations`;

  let contextContent = '';
  if (context && Array.isArray(context) && context.length > 0) {
    console.log('[llm/provider] Building context content from', context.length, 'items');
    contextContent = `\n\nRelevant Logseq context:\n`;
    for (const item of context) {
      console.log('[llm/provider] Adding context item:', item.pageName, 'blocks:', item.blocks?.length || 0);
      contextContent += `\n[[${item.pageName}]]\n`;
      if (item.blocks && item.blocks.length > 0) {
        contextContent += '```markdown\n';
        item.blocks.forEach((block) => {
          const content = block.content || '';
          const level = block.level || 0;
          const indent = '  '.repeat(level);
          contextContent += `${indent}- ${content || '(empty block)'}\n`;
        });
        contextContent += '```\n';
      } else if (item.excerpt) {
        contextContent += `${item.excerpt}\n`;
      }
    }
    contextContent += `\nYou have full access to the above content. Read and respond based on the actual content provided.\n`;
  } else {
    console.log('[llm/provider] WARNING: No context provided to LLM');
  }

  return systemPrompt + contextContent;
}

