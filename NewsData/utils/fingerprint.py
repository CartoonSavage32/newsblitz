"""Story fingerprint generation for deduplication."""

import hashlib
import re
from datetime import datetime


def _normalize_text(text: str) -> str:
    """Lowercase, remove punctuation, collapse whitespace."""
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def _round_to_6h_bucket(published_at: str | None) -> str:
    """Round datetime to 6-hour bucket (0, 6, 12, 18)."""
    if not published_at:
        return "unknown"
    
    try:
        if 'T' in published_at:
            dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
        else:
            dt = datetime.fromisoformat(published_at)
        
        bucket_hour = (dt.hour // 6) * 6
        return f"{dt.year}-{dt.month:02d}-{dt.day:02d}-{bucket_hour:02d}"
    except (ValueError, AttributeError):
        return "unknown"


def generate_story_fingerprint(title: str, content: str, published_at: str | None) -> str:
    """Generate SHA256 fingerprint from normalized title + content[:400] + time bucket."""
    normalized_title = _normalize_text(title or "")
    normalized_content = _normalize_text((content or "")[:400])
    time_bucket = _round_to_6h_bucket(published_at)
    
    fingerprint_source = f"{normalized_title}|{normalized_content}|{time_bucket}"
    return hashlib.sha256(fingerprint_source.encode('utf-8')).hexdigest()
