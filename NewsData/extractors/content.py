"""Article content extraction using newspaper3k."""

from dataclasses import dataclass
from newspaper import Article
from config.settings import MIN_CONTENT_LENGTH
from utils.urls import get_publisher_name


@dataclass
class ExtractedContent:
    text: str
    title: str
    url: str
    publish_date: str | None
    publisher: str


def extract_content(url: str, fallback_title: str = "", fallback_snippet: str = "") -> ExtractedContent | None:
    """Extract article content from URL."""
    publisher = get_publisher_name(url)
    
    result = _extract_with_newspaper(url)
    if result and len(result.text) >= MIN_CONTENT_LENGTH:
        return ExtractedContent(
            text=result.text,
            title=result.title or fallback_title,
            url=result.url or url,
            publish_date=result.publish_date.isoformat() if result.publish_date else None,
            publisher=publisher,
        )
    
    result = _extract_with_newspaper(f"{url}?amp")
    if result and len(result.text) >= MIN_CONTENT_LENGTH:
        return ExtractedContent(
            text=result.text,
            title=result.title or fallback_title,
            url=url,
            publish_date=result.publish_date.isoformat() if result.publish_date else None,
            publisher=publisher,
        )
    
    if fallback_snippet and len(fallback_snippet) >= 50:
        return ExtractedContent(
            text=f"{fallback_title}\n\n{fallback_snippet}",
            title=fallback_title,
            url=url,
            publish_date=None,
            publisher=publisher,
        )
    
    return None


def _extract_with_newspaper(url: str):
    """Extract article using newspaper3k."""
    try:
        article = Article(url)
        article.download()
        article.parse()
        return article
    except Exception:
        return None
