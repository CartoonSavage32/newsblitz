"""Article lifecycle management."""

from datetime import datetime, timedelta
from config.settings import ARTICLE_DELETE_DAYS, ARTICLE_EXPIRE_HOURS, ARTICLE_GONE_DAYS
from storage.supabase_client import get_client


def manage_lifecycle() -> tuple[int, int]:
    """Update article lifecycle states. Returns (expired_count, deleted_count)."""
    supabase = get_client()
    now = datetime.now()
    now_iso = now.isoformat()
    expired_count = 0
    deleted_count = 0
    
    try:
        result = supabase.table("news_articles").update({"expired": True}).lt("expired_at", now_iso).eq("expired", False).execute()
        expired_count += len(result.data) if result.data else 0
    except Exception:
        pass
    
    try:
        expired_cutoff = (now - timedelta(hours=ARTICLE_EXPIRE_HOURS)).isoformat()
        result = supabase.table("news_articles").update({"expired": True}).is_("expired_at", "null").lt("published_at", expired_cutoff).eq("expired", False).execute()
        expired_count += len(result.data) if result.data else 0
    except Exception:
        pass
    
    try:
        result = supabase.table("news_articles").delete().lt("deleted_at", now_iso).execute()
        deleted_count += len(result.data) if result.data else 0
    except Exception:
        pass
    
    try:
        delete_cutoff = (now - timedelta(days=ARTICLE_DELETE_DAYS)).isoformat()
        result = supabase.table("news_articles").delete().is_("deleted_at", "null").lt("published_at", delete_cutoff).execute()
        deleted_count += len(result.data) if result.data else 0
    except Exception:
        pass
    
    return expired_count, deleted_count


def calculate_lifecycle_dates(published_at: str | None) -> dict:
    """Calculate lifecycle timestamps for a new article."""
    try:
        base_time = datetime.fromisoformat(published_at.replace("Z", "+00:00")) if published_at else datetime.now()
    except ValueError:
        base_time = datetime.now()
    
    return {
        "expired_at": (base_time + timedelta(hours=ARTICLE_EXPIRE_HOURS)).isoformat(),
        "gone_at": (base_time + timedelta(days=ARTICLE_GONE_DAYS)).isoformat(),
        "deleted_at": (base_time + timedelta(days=ARTICLE_DELETE_DAYS)).isoformat(),
    }
