"""Application settings."""

import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY environment variable is required")

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError(
        "SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required"
    )

# Limits
MAX_ARTICLES_PER_FEED = 10
MIN_CONTENT_LENGTH = 100
MIN_TITLE_LENGTH = 10
REQUEST_TIMEOUT = 15
MIN_IMAGE_WIDTH = 300

# Fallback images
FALLBACK_PLACEHOLDER_IMAGE = "https://media.istockphoto.com/id/1409309637/vector/breaking-news-label-banner-isolated-vector-design.jpg?s=2048x2048&w=is&k=20&c=rHMT7lr46TFGxQqLQHvSGD6r79AIeTVng-KYA6J1XKM="

PUBLISHER_DEFAULT_IMAGES = {
    "reuters.com": "https://www.reuters.com/pf/resources/images/reuters/reuters-default.png",
    "bloomberg.com": "https://assets.bwbx.io/s3/javelin/public/javelin/images/bloomberg_default.png",
}

# Lifecycle (hours/days)
ARTICLE_EXPIRE_HOURS = 48
ARTICLE_GONE_DAYS = 7
ARTICLE_DELETE_DAYS = 30
