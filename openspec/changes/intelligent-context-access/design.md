# Design: Intelligent Context Access

## Architecture Overview

### Context Assembly Pipeline
1. **Query Analysis** → Detect intent (question vs update vs create)
2. **Page/Journal Resolution** → Query explicitly mentioned pages/journals
3. **Search Execution** → Find relevant pages via search with scoring
4. **Relevance Filtering** → Apply threshold and limits
5. **Block Selection** → Filter blocks within pages based on relevance
6. **Context Assembly** → Assemble final context within configured limits
7. **Summarization** (optional) → Condense large pages if needed

### Configurable Limits
- **Per-request limits**: Max pages, max blocks per page, max total blocks
- **Search limits**: Max search results, relevance threshold
- **Filtering options**: Namespace exclusion, tag filtering, date ranges
- **Block selection modes**: 'all', 'matched' (only blocks matching query), 'top' (top N by relevance)

### Relevance Scoring
- **Page-level**: Keyword matches, tag matches, name matches
- **Block-level**: Content keyword matches, proximity to matched blocks
- **Semantic**: Future enhancement using embeddings (not in initial scope)

### Settings Storage
- Extend `Settings` interface with optional `contextSettings` object
- Defaults: conservative limits (5 pages, 50 blocks/page, 100 total blocks)
- UI: Collapsible section in settings panel with clear labels

### Backward Compatibility
- If no context settings configured, use sensible defaults
- Existing behavior preserved for users who don't configure settings
- Settings are optional and can be left at defaults

## Trade-offs

### Conservative vs Aggressive Filtering
- **Conservative (default)**: Include more context, safer but more tokens
- **Aggressive**: Strict filtering, fewer tokens but risk missing relevant context
- **Solution**: User-configurable with sensible defaults

### Block Selection Complexity
- **Simple**: Include all blocks from matched pages (current)
- **Matched**: Only blocks containing query keywords
- **Top-N**: Highest relevance blocks within limits
- **Solution**: Configurable mode, default to 'all' for backward compatibility

### Relevance Threshold
- **Low threshold**: More results but potentially less relevant
- **High threshold**: Fewer results but highly relevant
- **Solution**: Default threshold of 1 (minimum score), user-configurable

