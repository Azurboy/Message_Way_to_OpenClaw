"""Process user custom RSS feeds: fetch from Supabase, deduplicate, summarize, store back."""

import asyncio
import hashlib
import json
import logging
import os

from pipeline.feed_fetcher import fetch_all_feeds
from pipeline.ai_summarizer import _get_client, _batch_summarize, VALID_TAGS, SILICONFLOW_MODEL
from pipeline.config import AI_BATCH_SIZE, FEEDS_OPML, SILICONFLOW_MODEL as MODEL
from pipeline.opml_parser import parse_opml

logger = logging.getLogger(__name__)

LONG_SUMMARY_PROMPT = """请为以下文章写一篇深度中文摘要（300-500字），包含：
1. 文章核心观点
2. 关键论据或数据
3. 对读者的实际价值

文章标题: {title}
来源: {feed_title}
内容:
{content}

请直接输出摘要正文，不要加标题或前缀。"""


def _get_supabase_client():
    """Create Supabase admin client using service role key."""
    try:
        from supabase import create_client
    except ImportError:
        logger.warning("supabase package not installed, skipping user feeds")
        return None

    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        logger.info("SUPABASE_URL/SUPABASE_SERVICE_KEY not set, skipping user feeds")
        return None

    return create_client(url, key)


def _make_article_id(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:16]


def _get_global_feed_urls() -> set[str]:
    """Get set of feed URLs from global OPML to deduplicate."""
    feeds = parse_opml(FEEDS_OPML)
    return {f["xml_url"].rstrip("/").lower() for f in feeds}


def process_user_feeds():
    """Main entry: fetch user feeds from Supabase, process, write results back."""
    sb = _get_supabase_client()
    if sb is None:
        return

    # Get all user feeds with user's custom prompt and tier
    result = sb.table("user_feeds").select(
        "id, user_id, feed_url, feed_title, profiles(custom_ai_prompt, tier)"
    ).execute()

    if not result.data:
        logger.info("No user feeds to process")
        return

    global_urls = _get_global_feed_urls()

    # Group feeds by user
    user_feeds: dict[str, list[dict]] = {}
    for row in result.data:
        uid = row["user_id"]
        if uid not in user_feeds:
            user_feeds[uid] = []
        user_feeds[uid].append(row)

    logger.info(f"Processing feeds for {len(user_feeds)} users")

    for user_id, feeds in user_feeds.items():
        try:
            _process_user(sb, user_id, feeds, global_urls)
        except Exception as e:
            logger.error(f"Failed processing user {user_id}: {e}")


def _process_user(sb, user_id: str, feeds: list[dict], global_urls: set[str]):
    """Process one user's custom feeds."""
    # Separate: feeds already in global set vs unique user feeds
    unique_feeds = []
    for f in feeds:
        normalized = f["feed_url"].rstrip("/").lower()
        if normalized not in global_urls:
            unique_feeds.append({
                "title": f.get("feed_title") or f["feed_url"],
                "xml_url": f["feed_url"],
                "html_url": "",
                "category": "user-custom",
            })

    if not unique_feeds:
        logger.info(f"User {user_id[:8]}...: all feeds overlap with global, skipping")
        return

    logger.info(f"User {user_id[:8]}...: fetching {len(unique_feeds)} unique feeds")

    # Fetch
    posts = asyncio.run(fetch_all_feeds(unique_feeds))
    if not posts:
        logger.info(f"User {user_id[:8]}...: no posts fetched")
        return

    # Sort by published_at descending, limit to newest 50
    posts = sorted(posts, key=lambda p: p.get("published_at", ""), reverse=True)[:50]

    # Get user's custom prompt and tier
    custom_prompt = None
    user_tier = "free"
    if feeds and feeds[0].get("profiles"):
        profile_data = feeds[0]["profiles"]
        if isinstance(profile_data, dict):
            custom_prompt = profile_data.get("custom_ai_prompt")
            user_tier = profile_data.get("tier", "free")

    # AI summarize (short summary for all users)
    articles = _summarize_user_posts(posts, custom_prompt)

    if not articles:
        return

    # Pro users get long summaries too
    if user_tier == "pro":
        _generate_long_summaries(articles)

    # Write to Supabase
    rows = []
    for a in articles:
        rows.append({
            "id": a["id"],
            "user_id": user_id,
            "title": a["title"],
            "url": a["url"],
            "feed_title": a.get("feed_title", ""),
            "summary_zh": a.get("summary_zh", ""),
            "summary_long": a.get("summary_long") or None,
            "tags": a.get("tags", []),
            "content_html": (a.get("content", "") or "")[:50000],
            "published_at": a.get("published_at") or None,
        })

    sb.table("user_articles").upsert(rows, on_conflict="id").execute()
    logger.info(f"User {user_id[:8]}...: wrote {len(rows)} articles (tier={user_tier})")


def _summarize_user_posts(posts: list[dict], custom_prompt: str | None = None) -> list[dict]:
    """Summarize posts for a user, optionally using their custom prompt."""
    try:
        client = _get_client()
    except RuntimeError:
        logger.warning("AI API not configured, skipping summarization")
        # Return articles without AI summary
        return [
            {
                "id": _make_article_id(p["url"]),
                "title": p["title"],
                "url": p["url"],
                "feed_title": p.get("feed_title", ""),
                "published_at": p.get("published_at", ""),
                "content": p.get("content", ""),
                "summary_zh": p["title"],
                "tags": ["tools"],
            }
            for p in posts
        ]

    articles = []
    for i in range(0, len(posts), AI_BATCH_SIZE):
        batch = posts[i : i + AI_BATCH_SIZE]
        summaries, _tokens = _batch_summarize(client, batch, custom_prompt)

        for j, post in enumerate(batch):
            idx = j + 1
            summary_data = summaries.get(idx)
            if summary_data:
                summary_zh = summary_data.get("summary_zh", post["title"])
                tags = [t for t in summary_data.get("tags", []) if t in VALID_TAGS]
            else:
                summary_zh = post["title"]
                tags = ["tools"]

            articles.append({
                "id": _make_article_id(post["url"]),
                "title": post["title"],
                "url": post["url"],
                "feed_title": post.get("feed_title", ""),
                "published_at": post.get("published_at", ""),
                "content": post.get("content", ""),
                "summary_zh": summary_zh,
                "tags": tags if tags else ["tools"],
            })

    return articles


def _generate_long_summaries(articles: list[dict]):
    """Generate long-form summaries for pro users. Modifies articles in-place."""
    try:
        client = _get_client()
    except RuntimeError:
        logger.warning("AI API not configured, skipping long summaries")
        return

    for article in articles:
        content = (article.get("content") or "")[:4000]
        if not content:
            continue

        prompt = LONG_SUMMARY_PROMPT.format(
            title=article["title"],
            feed_title=article.get("feed_title", ""),
            content=content,
        )

        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1500,
            )
            article["summary_long"] = response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"Long summary failed for {article['id']}: {e}")
