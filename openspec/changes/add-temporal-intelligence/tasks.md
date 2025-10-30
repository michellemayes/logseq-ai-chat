## 1. Journal Date Range Queries
- [x] 1.1 Create `queryJournalsByDateRange(startDate: Date, endDate: Date)` function
- [x] 1.2 Create `queryJournalsLastWeek()` convenience function
- [x] 1.3 Create `queryJournalsLastMonth()` convenience function
- [x] 1.4 Create `queryJournalsLastNDays(days: number)` function
- [x] 1.5 Filter journals from index by date range efficiently
- [x] 1.6 Return journal entries with date metadata

## 2. Natural Language Date Parsing
- [x] 2.1 Create `parseDateRange(query: string)` function
- [x] 2.2 Parse relative dates ("last week", "last month", "last 7 days")
- [x] 2.3 Parse absolute dates ("from 2025-01-01 to 2025-01-31")
- [x] 2.4 Handle ambiguous dates (default to common interpretations)
- [x] 2.5 Return start and end dates for queries

## 3. Journal Comparison
- [x] 3.1 Create `compareJournals(date1: Date, date2: Date)` function
- [x] 3.2 Compare content similarity (shared keywords)
- [x] 3.3 Compare tag overlap
- [x] 3.4 Compare block counts and activity levels
- [x] 3.5 Compare property presence
- [x] 3.6 Return comparison results with similarity scores

## 4. Pattern Detection
- [x] 4.1 Create `detectRecurringTags(journalDates: Date[])` function
- [x] 4.2 Create `detectRecurringTopics(journalDates: Date[])` function
- [x] 4.3 Create `detectRecurringContent(journalDates: Date[])` function
- [x] 4.4 Identify temporal patterns (e.g., journals on specific weekdays)
- [x] 4.5 Return patterns with frequency and examples

## 5. Temporal Query IPC Handlers
- [x] 5.1 Add `query-journals-by-date-range` IPC handler
- [x] 5.2 Add `query-journals-last-week` IPC handler
- [x] 5.3 Add `query-journals-last-month` IPC handler
- [x] 5.4 Add `compare-journals` IPC handler
- [x] 5.5 Add `detect-journal-patterns` IPC handler
- [x] 5.6 Expose temporal query methods in preload.ts ElectronAPI interface

## 6. LLM Integration
- [x] 6.1 Update system prompt to inform AI about temporal intelligence capabilities
- [x] 6.2 Add examples of temporal queries to system prompt
- [x] 6.3 Instruct AI to use temporal queries for date-related questions
- [x] 6.4 Include temporal context in responses when relevant

## 7. Context Injection
- [x] 7.1 Detect temporal queries in user input
- [x] 7.2 Query journals by date range when temporal queries detected
- [x] 7.3 Include journal summaries in context for temporal queries
- [x] 7.4 Include pattern detection results when relevant

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
