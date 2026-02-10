"""RSS feed fetcher - async concurrent fetching, stateless (no DB)."""

import asyncio
import logging
from datetime import datetime, timezone
from time import mktime

import feedparser
import httpx

from pipeline.config import FETCHER_MAX_CONCURRENT, FETCHER_TIMEOUT

logger = logging.getLogger(__name__)


async def fetch_all_feeds(feeds: list[dict]) -> list[dict]:
    """Fetch all feeds concurrently and return a flat list of posts.

    Args:
        feeds: List of feed dicts from OPML parser, each with
               'title', 'xml_url', 'html_url', 'category'.

    Returns:
        List of post dicts with keys: title, url, author, published_at,
        content, word_count, feed_title, feed_url, category.
    """
    if not feeds:
        return []

    semaphore = asyncio.Semaphore(FETCHER_MAX_CONCURRENT)
    results = await asyncio.gather(
        *[_fetch_single(feed, semaphore) for feed in feeds],
        return_exceptions=True,
    )

    all_posts = []
    success = 0
    failed = 0
    for r in results:
        if isinstance(r, list):
            all_posts.extend(r)
            success += 1
        else:
            failed += 1
            if isinstance(r, Exception):
                logger.debug(f"Feed fetch exception: {r}")

    logger.info(
        f"Fetched {success}/{len(feeds)} feeds, "
        f"got {len(all_posts)} posts, {failed} failed"
    )
    return all_posts


async def _fetch_single(feed: dict, semaphore: asyncio.Semaphore) -> list[dict]:
    """Fetch a single feed and return list of post dicts."""
    async with semaphore:
        xml_url = feed["xml_url"]
        feed_title = feed.get("title", "")
        category = feed.get("category", "")
        headers = {"User-Agent": "XinQiDong/1.0 RSS Aggregator"}

        try:
            async with httpx.AsyncClient(
                timeout=FETCHER_TIMEOUT, follow_redirects=True
            ) as client:
                resp = await client.get(xml_url, headers=headers)

            if resp.status_code != 200:
                logger.debug(f"HTTP {resp.status_code} for {xml_url}")
                return []

            parsed = feedparser.parse(resp.text)
            if parsed.bozo and not parsed.entries:
                logger.debug(f"Parse error for {xml_url}")
                return []

            posts = []
            for entry in parsed.entries:
                post = _parse_entry(entry, feed_title, xml_url, category)
                if post:
                    posts.append(post)
            return posts

        except Exception as e:
            logger.warning(f"Failed to fetch {xml_url}: {e}")
            raise


def _parse_entry(entry, feed_title: str, feed_url: str, category: str) -> dict | None:
    """Parse a single feed entry into a post dict."""
    title = entry.get("title", "").strip()
    url = entry.get("link", "").strip()
    if not title or not url:
        return None

    author = entry.get("author", "")

    published = entry.get("published_parsed") or entry.get("updated_parsed")
    published_at = ""
    if published:
        try:
            published_at = datetime.fromtimestamp(
                mktime(published), tz=timezone.utc
            ).isoformat()
        except Exception:
            pass

    content = ""
    if entry.get("content"):
        content = entry.content[0].get("value", "")
    elif entry.get("summary"):
        content = entry.summary
    elif entry.get("description"):
        content = entry.description

    word_count = len(content.split()) if content else 0

    return {
        "title": title,
        "url": url,
        "author": author,
        "published_at": published_at,
        "content": content,
        "word_count": word_count,
        "feed_title": feed_title,
        "feed_url": feed_url,
        "category": category,
    }
