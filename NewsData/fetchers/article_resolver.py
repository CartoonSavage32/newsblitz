"""Article URL validation."""

from utils.urls import is_aggregator_url


def validate_article_url(url: str) -> bool:
    """Check if URL is valid for article extraction."""
    if not url or not url.startswith(("http://", "https://")):
        return False
    return not is_aggregator_url(url)
