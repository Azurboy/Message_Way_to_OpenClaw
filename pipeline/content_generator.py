"""Generate static content files from digest data."""

import json
import logging
from datetime import date
from pathlib import Path

from pipeline.config import CONTENT_DIR, DIGESTS_DIR

logger = logging.getLogger(__name__)


def generate_content(digest: dict, feeds: list[dict]):
    """Write digest and feed data to site/content/.

    Creates:
      - site/content/digests/{date}.json
      - site/content/digests/{date}.md
      - site/content/digests/latest.json
      - site/content/feeds.json
      - site/content/index.json (archive index)
    """
    digest_date = digest["date"]

    # 1. Write digest JSON
    digest_json_path = DIGESTS_DIR / f"{digest_date}.json"
    _write_json(digest_json_path, digest)
    logger.info(f"Wrote {digest_json_path}")

    # 2. Write digest markdown
    digest_md_path = DIGESTS_DIR / f"{digest_date}.md"
    md_content = f"# 新启动 Daily - {digest_date}\n\n{digest['summary_md']}"
    digest_md_path.write_text(md_content, encoding="utf-8")
    logger.info(f"Wrote {digest_md_path}")

    # 3. Write latest.json (same content, easy access)
    latest_path = DIGESTS_DIR / "latest.json"
    _write_json(latest_path, digest)
    logger.info(f"Wrote {latest_path}")

    # 4. Write feeds.json
    feeds_data = {
        "count": len(feeds),
        "updated_at": digest_date,
        "feeds": feeds,
    }
    feeds_path = CONTENT_DIR / "feeds.json"
    _write_json(feeds_path, feeds_data)
    logger.info(f"Wrote {feeds_path}")

    # 5. Update archive index
    _update_index(digest_date, digest["post_count"], digest["top_count"])


def _update_index(digest_date: str, post_count: int, top_count: int):
    """Update the archive index.json with a new entry."""
    index_path = CONTENT_DIR / "index.json"
    if index_path.exists():
        index = json.loads(index_path.read_text(encoding="utf-8"))
    else:
        index = {"digests": []}

    # Remove existing entry for same date
    index["digests"] = [d for d in index["digests"] if d["date"] != digest_date]

    # Add new entry at the front
    index["digests"].insert(0, {
        "date": digest_date,
        "post_count": post_count,
        "top_count": top_count,
    })

    # Keep sorted by date descending
    index["digests"].sort(key=lambda d: d["date"], reverse=True)

    _write_json(index_path, index)
    logger.info(f"Updated archive index: {len(index['digests'])} entries")


def _write_json(path: Path, data: dict):
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )