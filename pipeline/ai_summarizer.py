"""AI summarizer: batch-summarize articles with tags using SiliconFlow API."""

import hashlib
import json
import logging
from datetime import date, datetime, timezone, timedelta

from openai import OpenAI

from pipeline.config import SILICONFLOW_API_KEY, SILICONFLOW_MODEL, AI_BATCH_SIZE

logger = logging.getLogger(__name__)

VALID_TAGS = [
    "AI", "LLM", "programming", "web", "security", "devops", "cloud",
    "open-source", "design", "business", "career", "hardware", "mobile",
    "database", "networking", "performance", "testing", "architecture",
    "tools", "culture",
]

BATCH_PROMPT_TEMPLATE = """请为以下 {count} 篇技术文章生成中文摘要和标签。

要求：
- summary_zh: 2-3句中文摘要，概括文章核心内容
- tags: 2-5个标签，必须从以下词表中选择：
  {tags}

文章列表：
{articles}

请以JSON格式回复，不要包含其他内容：
{{"articles": [{{"index": 1, "summary_zh": "...", "tags": ["AI", "LLM"]}}]}}"""


def _get_client() -> OpenAI:
    if not SILICONFLOW_API_KEY:
        raise RuntimeError("SILICONFLOW_API_KEY not configured")
    return OpenAI(
        api_key=SILICONFLOW_API_KEY,
        base_url="https://api.siliconflow.cn/v1",
    )


def _make_article_id(url: str) -> str:
    """Generate a short deterministic ID from URL using sha256."""
    return hashlib.sha256(url.encode()).hexdigest()[:16]


def _filter_recent_posts(posts: list[dict], hours: int = 48) -> list[dict]:
    """Filter posts to only those published within the last N hours."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    cutoff_iso = cutoff.isoformat()
    recent = []
    for p in posts:
        pub = p.get("published_at", "")
        if pub and pub >= cutoff_iso:
            recent.append(p)
    return recent


def summarize_articles(posts: list[dict]) -> dict:
    """Filter recent posts, batch-summarize with AI, return articles data.

    Args:
        posts: List of post dicts from feed_fetcher.

    Returns:
        Dict with keys: date, article_count, tokens_used, ai_model, articles.
    """
    today = date.today().isoformat()

    if not posts:
        return {
            "date": today,
            "article_count": 0,
            "tokens_used": 0,
            "ai_model": SILICONFLOW_MODEL,
            "articles": [],
        }

    # Filter to recent posts (last 48h)
    recent = _filter_recent_posts(posts, hours=48)
    if not recent:
        recent = sorted(posts, key=lambda p: p.get("published_at", ""), reverse=True)[:50]
    recent = sorted(recent, key=lambda p: p.get("published_at", ""), reverse=True)
    logger.info(f"Summarizing {len(recent)} recent articles (from {len(posts)} total)")

    client = _get_client()
    total_tokens = 0
    articles = []

    # Process in batches
    for i in range(0, len(recent), AI_BATCH_SIZE):
        batch = recent[i:i + AI_BATCH_SIZE]
        batch_num = i // AI_BATCH_SIZE + 1
        total_batches = (len(recent) + AI_BATCH_SIZE - 1) // AI_BATCH_SIZE
        logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} articles)")
        summaries, tokens = _batch_summarize(client, batch)
        total_tokens += tokens

        for j, post in enumerate(batch):
            idx = j + 1
            summary_data = summaries.get(idx, None)
            if summary_data:
                summary_zh = summary_data.get("summary_zh", post["title"])
                tags = [t for t in summary_data.get("tags", []) if t in VALID_TAGS]
            else:
                # Fallback: use title as summary, category as tag
                summary_zh = post["title"]
                cat = post.get("category", "")
                tags = _category_to_tags(cat)

            articles.append({
                "id": _make_article_id(post["url"]),
                "title": post["title"],
                "url": post["url"],
                "author": post.get("author", ""),
                "feed_title": post.get("feed_title", ""),
                "category": post.get("category", ""),
                "published_at": post.get("published_at", ""),
                "content": post.get("content", ""),
                "summary_zh": summary_zh,
                "tags": tags if tags else ["tools"],
            })

    logger.info(f"Summarized {len(articles)} articles, {total_tokens} tokens used")
    return {
        "date": today,
        "article_count": len(articles),
        "tokens_used": total_tokens,
        "ai_model": SILICONFLOW_MODEL,
        "articles": articles,
    }


def _category_to_tags(category: str) -> list[str]:
    """Map OPML category to valid tags as fallback."""
    cat_lower = category.lower()
    tags = []
    mapping = {
        "ai": "AI", "ml": "AI", "machine learning": "AI",
        "llm": "LLM", "language model": "LLM",
        "programming": "programming", "dev": "programming", "code": "programming",
        "web": "web", "frontend": "web", "backend": "web",
        "security": "security", "infosec": "security",
        "devops": "devops", "ops": "devops", "sre": "devops",
        "cloud": "cloud", "aws": "cloud", "gcp": "cloud", "azure": "cloud",
        "open source": "open-source", "oss": "open-source",
        "design": "design", "ux": "design", "ui": "design",
        "business": "business", "startup": "business",
    }
    for key, tag in mapping.items():
        if key in cat_lower and tag not in tags:
            tags.append(tag)
    return tags


def _batch_summarize(client: OpenAI, batch: list[dict], custom_prompt: str | None = None) -> tuple[dict, int]:
    """Summarize a batch of articles in one AI call. Returns (summaries_dict, tokens).

    summaries_dict maps 1-based index to {"summary_zh": ..., "tags": [...]}.
    On failure, retries once, then returns empty dict (caller uses fallback).

    Args:
        client: OpenAI client
        batch: list of post dicts
        custom_prompt: optional user-provided prompt to prepend to the system instruction
    """
    article_text = ""
    for i, post in enumerate(batch):
        content_snippet = (post.get("content") or "")[:1500]
        article_text += (
            f"\n---\n文章 {i+1}:\n"
            f"标题: {post['title']}\n"
            f"来源: {post.get('feed_title', '')}\n"
            f"分类: {post.get('category', '')}\n"
            f"内容: {content_snippet}\n"
        )

    prompt = BATCH_PROMPT_TEMPLATE.format(
        count=len(batch),
        tags=", ".join(VALID_TAGS),
        articles=article_text,
    )

    if custom_prompt:
        prompt = f"用户自定义要求：{custom_prompt}\n\n{prompt}"

    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model=SILICONFLOW_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=4000,
            )
            content = response.choices[0].message.content.strip()
            tokens = response.usage.total_tokens if response.usage else 0

            # Strip markdown code fences if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            result = json.loads(content)

            summaries = {}
            for item in result.get("articles", []):
                idx = item.get("index")
                if idx is not None:
                    summaries[idx] = {
                        "summary_zh": item.get("summary_zh", ""),
                        "tags": item.get("tags", []),
                    }
            return summaries, tokens

        except Exception as e:
            if attempt == 0:
                logger.warning(f"Batch summarize attempt 1 failed, retrying: {e}")
            else:
                logger.error(f"Batch summarize failed after 2 attempts: {e}")
                return {}, 0
