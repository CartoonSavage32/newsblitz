"""Database write operations."""

from dataclasses import dataclass
from processors.lifecycle import calculate_lifecycle_dates
from storage.supabase_client import get_client


@dataclass
class ArticleData:
    category: str
    title: str
    summary: str
    image_url: str
    source: str
    published_at: str | None
    article_url: str
    original_content: str
    snippet: str = ""


def insert_article(article: ArticleData) -> bool:
    """Insert article into database."""
    lifecycle = calculate_lifecycle_dates(article.published_at)
    
    try:
        get_client().table("news_articles").insert({
            "category": article.category,
            "title": article.title,
            "summary": article.summary,
            "image_url": article.image_url,
            "source": article.source,
            "published_at": article.published_at,
            "article_url": article.article_url,
            "expired": False,
            "expired_at": lifecycle["expired_at"],
            "gone_at": lifecycle["gone_at"],
            "deleted_at": lifecycle["deleted_at"],
            "raw": {"snippet": article.snippet, "original_content": article.original_content},
        }).execute()
        return True
    except Exception as e:
        print(f"  Insert error: {e}")
        return False
