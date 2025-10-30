### Stress Test Prompts 

- Basic context retrieval
  - “What did I write about ‘Vibe Coding’ recently? Cite sources.”
  - “Summarize the ‘Projects’ page in 5 bullets with citations.”
  - “Find notes mentioning ‘design system’ across my graph.”

- Temporal intelligence
  - “What did I write last week? Compare with the week before.”
  - “Show patterns in my journals from 2025-01-01 to 2025-02-15.”
  - “What changed between 2025-10-20 and 2025-10-29 journals?”

- Temporal queries (edge cases)
  - “What did I write last month?” (when no journals exist)
  - “Show journals in the last 999 days.” (limit/overflow check)

- Task management: query
  - “Show all TODO items.”
  - “List DOING tasks on the ‘Projects’ page.”
  - “What tasks are due this week?”
  - “Show tasks between 2025-10-01 and 2025-10-31.”

- Task management: updates
  - “Mark ‘Review PR’ as DONE.”
  - “Change ‘Write summary’ to DOING.”
  - “Mark the ‘Fix CI’ task as LATER.”  
  - “Mark ‘Learn the basics of Vibe Coding’ as DONE.” (journal task)
  - “Mark ‘Refactor components’ on the ‘Frontend’ page as DONE.” (page task)

- Task management: no hallucinations
  - “Do I have any TODOs?” (when none exist)
  - “What tasks are due this week?” (when none exist)

- Block references
  - “Refer to the exact block that defines ‘Vibe Coding’ using a block reference, and explain why it’s important.”
  - “Link to the block discussing ‘onboarding checklist’ using ((block-id)) and summarize it.”

- Block navigation and preview
  - “Open the block you just referenced about ‘design tokens’ and show its parent page context.”

- Multi-action content creation (stress auto-execution)
  - “Create a journal entry for today with a recap and add a ‘TODO Draft blog outline’. Then append a bullet to the ‘Projects’ page: ‘- Finalize roadmap by Friday’.”
  - “Create two pages: ‘Team Charter’ and ‘Engineering Principles’, each with three bullets. Then append ‘- Revisit Q4 OKRs’ to ‘Team Charter’.”

- Append vs create (idempotency/duplicates)
  - “Append ‘- Reviewed API limits’ to today’s journal. Append the same line again. Ensure it doesn’t duplicate.”

- Search + traversal
  - “Show pages connected to ‘AI Strategy’ (both backlinks and forward links).”
  - “Find related pages about ‘Design System’ up to 2 hops.”
  - “List orphaned pages.”

- Natural language date parsing (edge)
  - “Compare today’s journal with last Wednesday.”
  - “Show journals from the last 3 weeks.”

- Context limits and filtering
  - “Summarize all notes about ‘TypeScript performance’ using matched-block mode. Keep under 100 blocks total.”
  - “Find top insights on ‘testing strategy’ but limit to 3 pages.”

- Providers and settings (manual verification)
  - “Switch to Groq and summarize the ‘Backend’ page.”
  - “Switch to Ollama and analyze ‘Latency issues’ page.”

- Citations behavior
  - “Answer with citations; include the most relevant 3 sources only.”
  - “Explain how you derived this answer from the sources.”

- Copy + UI behavior
  - “Give me a 10-bullet summary of ‘Vibe Coding’ with code blocks and links.” (then test copying)
  - “Return a brief answer with no sources.” (verify collapsed sources + copy)

- Backup files excluded
  - “Summarize anything in ‘bak’ directories.” (should respond that nothing is found)

- Journal templates and patterns
  - “Generate a daily journal template with Tasks, Notes, and Insights sections.”
  - “Detect recurring tags/topics in the last month of journals.”

- Robustness with missing IDs
  - “Mark the ‘Draft blog outline’ task as DONE.” (when no block-id is visible; should match by content safely)

- Conversation export
  - “Export this conversation. Verify timestamps are included and correct.”

- Long titles and header truncation
  - “Rename this conversation to a very long title that exceeds 40 characters so I can see truncation.”

- Error handling paths (non-interactive)
  - “Append to page ‘NonExistentPageX’.” (should create or handle gracefully based on policy)
  - “Add a note to ‘journals/1999_01_01’.” (invalid date/edge behavior)