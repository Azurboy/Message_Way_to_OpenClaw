"""Pipeline configuration from environment variables."""

import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
FEEDS_OPML = BASE_DIR / "feeds.opml"
CONTENT_DIR = BASE_DIR / "site" / "content"
DIGESTS_DIR = CONTENT_DIR / "digests"

# Ensure output dirs exist
CONTENT_DIR.mkdir(parents=True, exist_ok=True)
DIGESTS_DIR.mkdir(parents=True, exist_ok=True)

# API
SILICONFLOW_API_KEY = os.getenv("SILICONFLOW_API_KEY", "")
SILICONFLOW_MODEL = os.getenv("SILICONFLOW_MODEL", "deepseek-ai/DeepSeek-V3.2")

# Fetcher
FETCHER_MAX_CONCURRENT = int(os.getenv("FETCHER_MAX_CONCURRENT", "20"))
FETCHER_TIMEOUT = int(os.getenv("FETCHER_TIMEOUT", "15"))

# AI
AI_SNIPPET_LENGTH = int(os.getenv("AI_SNIPPET_LENGTH", "300"))
AI_TOP_N = int(os.getenv("AI_TOP_N", "15"))
