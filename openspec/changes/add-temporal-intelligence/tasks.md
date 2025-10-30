## 1. Journal Date Range Queries
- [ ] 1.1 Create `queryJournalsByDateRange(startDate: Date, endDate: Date)` function
- [ ] 1.2 Create `queryJournalsLastWeek()` convenience function
- [ ] 1.3 Create `queryJournalsLastMonth()` convenience function
- [ ] 1.4 Create `queryJournalsLastNDays(days: number)` function
- [ ] 1.5 Filter journals from index by date range efficiently
- [ ] 1.6 Return journal entries with date metadata

## 2. Natural Language Date Parsing
- [ ] 2.1 Create `parseDateRange(query: string)` function
- [ ] 2.2 Parse relative dates ("last week", "last month", "last 7 days")
- [ ] 2.3 Parse absolute dates ("from 2025-01-01 to 2025-01-31")
- [ ] 2.4 Handle ambiguous dates (default to common interpretations)
- [ ] 2.5 Return start and end dates for queries

## 3. Journal Comparison
- [ ] 3.1 Create `compareJournals(date1: Date, date2: Date)` function
- [ ] 3.2 Compare content similarity (shared keywords)
- [ ] 3.3 Compare tag overlap
- [ ] 3.4 Compare block counts and activity levels
- [ ] 3.5 Compare property presence
- [ ] 3.6 Return comparison results with similarity scores

## 4. Pattern Detection
- [ ] 4.1 Create `detectRecurringTags(journalDates: Date[])` function
- [ ] 4.2 Create `detectRecurringTopics(journalDates: Date[])` function
- [ ] 4.3 Create `detectRecurringContent(journalDates: Date[])` function
- [ ] 4.4 Identify temporal patterns (e.g., journals on specific weekdays)
- [ ] 4.5 Return patterns with frequency and examples

## 5. Temporal Query IPC Handlers
- [ ] 5.1 Add `query-journals-by-date-range` IPC handler
- [ ] 5.2 Add `query-journals-last-week` IPC handler
- [ ] 5.3 Add `query-journals-last-month` IPC handler
- [ ] 5.4 Add `compare-journals` IPC handler
- [ ] 5.5 Add `detect-journal-patterns` IPC handler
- [ ] 5.6 Expose temporal query methods in preload.ts ElectronAPI interface

## 6. LLM Integration
- [ ] 6.1 Update system prompt to inform AI about temporal intelligence capabilities
- [ ] 6.2 Add examples of temporal queries to system prompt
- [ ] 6.3 Instruct AI to use temporal queries for date-related questions
- [ ] 6.4 Include temporal context in responses when relevant

## 7. Context Injection
- [ ] 7.1 Detect temporal queries in user input
- [ ] 7.2 Query journals by date range when temporal queries detected
- [ ] 7.3 Include journal summaries in context for temporal queries
- [ ] 7.4 Include pattern detection results when relevant

## 8. Testing and Validation
- [ ] 8.1 Unit tests for `queryJournalsByDateRange` function
- [ ] 8.2 Unit tests for date parsing functions
- [ ] 8.3 Unit tests for journal comparison
- [ ] 8.4 Unit tests for pattern detection
- [ ] 8.5 Integration tests for temporal IPC handlers
- [ ] 8.6 Manual test: Query "what did I write last week?"
- [ ] 8.7 Manual test: Compare two journal entries
- [ ] 8.8 Manual test: Detect recurring patterns
- [ ] 8.9 Performance test: Query large date ranges (100+ journals)

