"""Article deduplication."""

from storage.supabase_client import get_client


def is_duplicate(article_url: str) -> bool:
    """Check if article URL already exists in database."""
    try:
        result = (
            get_client()
            .table("news_articles")
            .select("id")
            .eq("article_url", article_url)
            .limit(1)
            .execute()
        )
        return bool(result.data)
    except Exception:
        return False
