"""Generate static content files from articles data."""

import json
import logging
from pathlib import Path

from pipeline.config import CONTENT_DIR, ARTICLES_DIR, ARTICLE_CONTENT_DIR

logger = logging.getLogger(__name__)


def generate_content(articles_data: dict, feeds: list[dict]):
    """Write articles and feed data to site/content/.

    Creates:
      - site/content/articles/{date}.json (without content field)
      - site/content/articles/latest.json (without content field)
      - site/content/article-content/{id}.json (individual article content)
      - site/content/feeds.json
      - site/content/index.json (archive index)
    """
    articles_date = articles_data["date"]

    # 1. Write individual article content files and strip content from main data
    articles_for_list = []
    for article in articles_data["articles"]:
        article_id = article["id"]
        content = article.get("content", "")

        # Write individual content file
        content_file = ARTICLE_CONTENT_DIR / f"{article_id}.json"
        _write_json(content_file, {
            "id": article_id,
            "title": article["title"],
            "url": article["url"],
            "content": content,
        })

        # Create article entry without content for the list
        article_without_content = {k: v for k, v in article.items() if k != "content"}
        articles_for_list.append(article_without_content)

    logger.info(f"Wrote {len(articles_for_list)} individual content files to {ARTICLE_CONTENT_DIR}")

    # 2. Write articles JSON (without content field)
    articles_list_data = {
        "date": articles_data["date"],
        "article_count": articles_data["article_count"],
        "tokens_used": articles_data["tokens_used"],
        "ai_model": articles_data["ai_model"],
        "articles": articles_for_list,
    }

    articles_json_path = ARTICLES_DIR / f"{articles_date}.json"
    _write_json(articles_json_path, articles_list_data)
    logger.info(f"Wrote {articles_json_path}")

    # 3. Write latest.json (same content, easy access)
    latest_path = ARTICLES_DIR / "latest.json"
    _write_json(latest_path, articles_list_data)
    logger.info(f"Wrote {latest_path}")

    # 4. Write feeds.json
    feeds_data = {
        "count": len(feeds),
        "updated_at": articles_date,
        "feeds": feeds,
    }
    feeds_path = CONTENT_DIR / "feeds.json"
    _write_json(feeds_path, feeds_data)
    logger.info(f"Wrote {feeds_path}")

    # 5. Update archive index
    _update_index(articles_date, articles_data["article_count"])


def _update_index(articles_date: str, article_count: int):
    """Update the archive index.json with a new entry."""
    index_path = CONTENT_DIR / "index.json"
    if index_path.exists():
        index = json.loads(index_path.read_text(encoding="utf-8"))
    else:
        index = {"entries": []}

    # Migrate old format if needed
    if "digests" in index and "entries" not in index:
        index["entries"] = index.pop("digests")

    entries = index.get("entries", [])

    # Remove existing entry for same date
    entries = [e for e in entries if e.get("date") != articles_date]

    # Add new entry at the front
    entries.insert(0, {
        "date": articles_date,
        "article_count": article_count,
    })

    # Keep sorted by date descending
    entries.sort(key=lambda e: e["date"], reverse=True)
    index["entries"] = entries

    _write_json(index_path, index)
    logger.info(f"Updated archive index: {len(entries)} entries")


def _write_json(path: Path, data: dict):
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
