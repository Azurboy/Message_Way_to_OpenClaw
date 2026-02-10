"""Main pipeline entry point: fetch feeds → AI summarize → generate content."""

import asyncio
import logging
import sys

from pipeline.config import FEEDS_OPML
from pipeline.opml_parser import parse_opml
from pipeline.feed_fetcher import fetch_all_feeds
from pipeline.ai_summarizer import generate_digest
from pipeline.content_generator import generate_content

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def main():
    # 1. Parse OPML
    logger.info(f"Parsing OPML: {FEEDS_OPML}")
    feeds = parse_opml(FEEDS_OPML)
    logger.info(f"Found {len(feeds)} feeds")

    if not feeds:
        logger.error("No feeds found in OPML file")
        sys.exit(1)

    # 2. Fetch all feeds
    logger.info("Fetching feeds...")
    posts = await fetch_all_feeds(feeds)
    logger.info(f"Fetched {len(posts)} posts total")

    if not posts:
        logger.warning("No posts fetched, generating empty digest")

    # 3. AI summarize
    logger.info("Generating AI digest...")
    digest = generate_digest(posts)
    logger.info(
        f"Digest for {digest['date']}: "
        f"{digest['post_count']} posts, "
        f"{digest['top_count']} top picks, "
        f"{digest['tokens_used']} tokens used"
    )

    # 4. Generate static content
    logger.info("Writing content files...")
    generate_content(digest, feeds)
    logger.info("Done!")


if __name__ == "__main__":
    asyncio.run(main())
