"""Article deduplication using story fingerprints."""

from storage.supabase_client import get_client


def is_duplicate_fingerprint(fingerprint: str, title: str) -> bool:
    """Check if story fingerprint exists in database."""
    try:
        result = (
            get_client()
            .table("news_articles")
            .select("id")
            .eq("story_fingerprint", fingerprint)
            .limit(1)
            .execute()
        )
        
        if result.data:
            print(f"  ⊘ Duplicate story (fingerprint): {title[:60]}...")
            return True
        return False
    except Exception as e:
        print(f"  Fingerprint check error: {e}")
        return False
