"""Main pipeline entry point: fetch feeds → AI summarize → generate content."""

import asyncio
import logging
import sys

from pipeline.config import FEEDS_OPML
from pipeline.opml_parser import parse_opml
from pipeline.feed_fetcher import fetch_all_feeds
from pipeline.ai_summarizer import summarize_articles
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
        logger.warning("No posts fetched, generating empty articles data")

    # 3. AI summarize all recent articles
    logger.info("Summarizing articles...")
    articles_data = summarize_articles(posts)
    logger.info(
        f"Articles for {articles_data['date']}: "
        f"{articles_data['article_count']} articles, "
        f"{articles_data['tokens_used']} tokens used"
    )

    # 4. Generate static content
    logger.info("Writing content files...")
    generate_content(articles_data, feeds)
    logger.info("Done with global pipeline!")

    # 5. Process user custom feeds (writes to Supabase, not static files)
    try:
        from pipeline.user_feeds import process_user_feeds
        logger.info("Processing user custom feeds...")
        process_user_feeds()
        logger.info("User feeds done!")
    except Exception as e:
        logger.error(f"User feeds processing failed (non-fatal): {e}")



if __name__ == "__main__":
    asyncio.run(main())
