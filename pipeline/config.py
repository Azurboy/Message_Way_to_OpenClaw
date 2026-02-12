"""Pipeline configuration from environment variables."""

import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
FEEDS_OPML = BASE_DIR / "feeds.opml"
CONTENT_DIR = BASE_DIR / "site" / "content"
ARTICLES_DIR = CONTENT_DIR / "articles"
ARTICLE_CONTENT_DIR = CONTENT_DIR / "article-content"  # Individual article content files

# Ensure output dirs exist
CONTENT_DIR.mkdir(parents=True, exist_ok=True)
ARTICLES_DIR.mkdir(parents=True, exist_ok=True)
ARTICLE_CONTENT_DIR.mkdir(parents=True, exist_ok=True)

# API
SILICONFLOW_API_KEY = os.getenv("SILICONFLOW_API_KEY", "")
SILICONFLOW_MODEL = os.getenv("SILICONFLOW_MODEL", "deepseek-ai/DeepSeek-V3.2")

# Fetcher
FETCHER_MAX_CONCURRENT = int(os.getenv("FETCHER_MAX_CONCURRENT", "20"))
FETCHER_TIMEOUT = int(os.getenv("FETCHER_TIMEOUT", "15"))

# AI
AI_BATCH_SIZE = int(os.getenv("AI_BATCH_SIZE", "12"))
