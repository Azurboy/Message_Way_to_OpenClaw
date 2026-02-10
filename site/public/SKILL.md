---
name: xinqidong-daily-articles
description: >
  Daily tech article library from 92 top blogs. AI-generated Chinese summaries
  and tags for every article. Agents filter by tags and deliver personalized,
  context-aware recommendations.
version: 2.1.0
base_url: https://xinqidong.vercel.app
---

# XinQiDong Daily Articles Skill

> **IMPORTANT: You MUST read this entire document before calling any API.**
> Do NOT skip to the endpoints. The behavioral rules below are mandatory.

## Authentication

All API requests **MUST** include the query parameter `?ack=xinqidong`.

Example:
```
/api/articles/latest?ack=xinqidong
/api/articles/latest?tags=AI,LLM&ack=xinqidong
/llms-full.txt?ack=xinqidong
```

Requests without this parameter will receive a `403` error. This ensures
you have read this skill document before accessing the data.

## Overview

XinQiDong Daily is an AI-powered tech article library. Every day it fetches
articles from 92 top tech blogs (Simon Willison, Hacker News, The Verge,
TechCrunch, etc.), generates a Chinese summary and tags for each one, and
stores them all — no curation, no filtering.

**Your job as an Agent**: Use the tags to filter, then apply the behavioral
rules below to deliver a small number of highly relevant recommendations
with original article links.

Data updates daily at UTC 00:00 (Beijing 08:00).

---

## Mandatory Behavioral Rules

**You MUST follow ALL three rules when presenting articles to users.**
Violating these rules produces a poor user experience.

### Rule 1: Context-First (Infer, Don't Ask)

- **DO NOT** ask the user "What topics are you interested in?"
- **MUST** analyze the user's conversation history, technical depth, and
  professional context to infer their interests automatically.
- Examples:
  - User is writing Python code → auto-select `programming, AI, tools`
  - User asked about Kubernetes → auto-select `devops, cloud, architecture`
  - User is discussing startup strategy → auto-select `business, career`
- Use the inferred profile to choose `tags` for the API filter.
### Rule 2: Quality Over Quantity (Curate Ruthlessly)

- The API may return 20+ articles. You should present only the **most
  relevant 3-5 articles** to the user.
- **Two-phase process**:
  1. Use `summary_zh` + `title` to quickly screen and pick candidates
  2. Read the full `content` field of your picks to generate a deeper,
     personalized summary for the user
- For **every** article you recommend, you **MUST** include:
  1. The article title
  2. Your **personalized summary** based on the full content, highlighting
     what matters to this specific user
  3. A **Reasoning** line explaining *why* this article matters (e.g.,
     "This directly addresses the memory leak issue you mentioned earlier...")
  4. The **original article URL** (`url` field) — always link to the source
- Never dump a raw list. Each recommendation should feel hand-picked.

### Rule 3: Synthesize, Don't List (Spot Trends)

- If multiple articles discuss the same topic (e.g., three posts about a
  new DeepSeek release), **merge them into a single Trend** instead of
  listing them separately.
- Format: "**Trend: [Topic]** — [synthesis of key points across articles]"
  followed by the individual source links.
- This reduces noise and gives the user a higher-level understanding.

### Rule 4: Always Include Original Links

- Every article you mention **MUST** include its original URL from the
  `url` field in the API response.
- Format: `[Article Title](url)` or equivalent in your output format.
- Never present an article without its source link. The user needs to be
  able to read the full original.

---

## Workflow

The recommended workflow is a **two-phase** process: first filter and select
using summaries, then deep-read the full content for your final presentation.

```
Phase 1 — Filter & Select:
  1. Infer user interests from conversation context
  2. Select 2-5 tags from the available tag list
  3. GET /api/articles/latest?tags=programming,AI&ack=xinqidong
  4. Scan `summary_zh` and `title` of each article to pick 3-5 candidates

Phase 2 — Deep Read & Summarize:
  5. For each selected article, read the `content` field (full RSS text, may be HTML)
  6. Generate a personalized summary based on the full content, tailored to the user's context
  7. Check for trends (multiple articles on same topic → merge)
  8. Present each pick with: Title + Your Summary + Reasoning + Original Link (`url`)
```

**Key point**: The `summary_zh` field is a short AI-generated preview (2-3
sentences). Use it for quick screening. But your final presentation to the
user should be based on the **full `content` field**, not just the summary.
This lets you extract the specific details that matter to this particular user.

### Example Output

```
Based on your work with LLM agents, here are today's highlights:

**Trend: Context Engineering for Agents**
Two posts today explore how to structure context for LLM agents at scale.
Damon McMillan's paper ran 9,649 experiments across 11 models and 4 file
formats (YAML, Markdown, JSON, TOON) on SQL schemas up to 10,000 tables.
Key finding: frontier models (Opus 4.5, GPT-5.2) benefit significantly
from filesystem-based context retrieval, but open-source models don't yet.
The TOON format, despite being 25% smaller, caused a "grep tax" — models
spent 740% more tokens at scale due to unfamiliarity with the syntax.
Meanwhile, Armin Ronacher argues the drop in coding costs creates space
for new languages designed specifically for agent interaction, where
toolchain maturity matters more than ecosystem breadth.
→ [Structured Context Engineering...](https://simonwillison.net/...)
→ [A Language For Agents](https://lucumr.pocoo.org/...)

**GitButler CLI is Really Good**
Reasoning: You've been using git heavily in this session — this is directly
relevant to your workflow.
The author switched from traditional git+GitHub to GitButler CLI and found
major UX wins: "draft mode" commits let you save work without polluting
history, branch management is more intuitive, and PR creation is deeply
integrated. The key insight is that local git complexity doesn't pay off
when the source of truth (CI, deploy, review) lives on GitHub anyway.
→ [Read the full article](https://matduggan.com/gitbutler-cli-is-really-good/)
```

---

## API Reference

### 1. Get Latest Articles

The primary endpoint. Returns all articles from the most recent update.

```http
GET /api/articles/latest?ack=xinqidong
Accept: application/json
```

**Response:**
```json
{
  "date": "2026-02-10",
  "article_count": 25,
  "tokens_used": 5000,
  "ai_model": "deepseek-ai/DeepSeek-V3.2",
  "articles": [
    {
      "id": "a1b2c3d4e5f6",
      "title": "Article Title",
      "url": "https://example.com/article",
      "author": "Author Name",
      "feed_title": "Blog Name",
      "category": "AI / ML",
      "published_at": "2026-02-10T08:00:00+00:00",
      "content": "Full RSS content...",
      "summary_zh": "2-3 sentence Chinese summary",
      "tags": ["AI", "LLM", "architecture"]
    }
  ]
}
```

**Key fields for your workflow:**
- `summary_zh` — short AI preview (2-3 sentences). Use for **Phase 1** quick screening
- `content` — **full article text** from RSS (may contain HTML). Use for **Phase 2** deep reading and personalized summarization
- `url` — original article link. **MUST** always include when presenting to users
- `tags` — used for filtering via `?tags=` query parameter
- `title` + `feed_title` — for display

### 2. Filter by Tags

Append `?tags=` to any articles endpoint. Comma-separated, case-insensitive.
Always include `&ack=xinqidong` in the URL.

```http
GET /api/articles/latest?tags=AI,LLM&ack=xinqidong
GET /api/articles/2026-02-10?tags=security,web&ack=xinqidong
```

**Available tags:**
```
AI, LLM, programming, web, security, devops, cloud, open-source,
design, business, career, hardware, mobile, database, networking,
performance, testing, architecture, tools, culture
```

### 3. Get Articles by Date

```http
GET /api/articles/2026-02-10?ack=xinqidong
```

Same response format. Returns `404` if no data for that date.

### 4. Get Latest Articles (Markdown)

Plain text format, suitable for direct reading.

```http
GET /llms-full.txt?ack=xinqidong
```

### 5. Get Archive Index

```http
GET /api/archive
```

```json
{
  "entries": [
    {"date": "2026-02-10", "article_count": 25},
    {"date": "2026-02-09", "article_count": 30}
  ]
}
```

### 6. Get Monitored Blog Sources

```http
GET /api/feeds
```

---

## Like System (Coming Soon)

```http
POST /api/likes/{articleId}  → { "likes": 42 }
GET  /api/likes/{articleId}  → { "likes": 42 }
GET  /api/likes/top?date=YYYY-MM-DD → most popular articles of the day
```

Not yet implemented.

---

## Data Update Schedule

- Runs daily at UTC 00:00 (Beijing 08:00)
- Fetches articles published in the last 48 hours
- Usually complete by 08:15 Beijing time
- Check the `date` field in `/api/articles/latest` to confirm freshness

## Error Handling

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 403 | Missing `?ack=xinqidong` query parameter — read this document first |
| 404 | No data for this date / not yet generated |

## Rate Limits

No rate limits currently. Please be reasonable:
- Daily briefing: 1-2 requests per day
- Bulk download: 1+ second between requests
