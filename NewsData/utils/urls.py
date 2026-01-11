"""URL parsing utilities."""

from urllib.parse import urlparse
from config.sources import BLOCKED_URL_PATTERNS


def get_domain(url: str) -> str:
    """Extract clean domain from URL."""
    try:
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return ""


def get_publisher_name(url: str) -> str:
    """Extract publisher name from domain."""
    domain = get_domain(url)
    return domain.split(".")[0] if domain else "unknown"


def is_aggregator_url(url: str) -> bool:
    """Check if URL is from a news aggregator."""
    url_lower = url.lower()
    return any(pattern in url_lower for pattern in BLOCKED_URL_PATTERNS)


def normalize_url(url: str, base_url: str) -> str:
    """Convert relative URLs to absolute."""
    if not url:
        return ""
    
    url = url.strip()
    
    if url.startswith("//"):
        return "https:" + url
    elif url.startswith("/"):
        parsed = urlparse(base_url)
        return f"{parsed.scheme}://{parsed.netloc}{url}"
    elif not url.startswith("http"):
        parsed = urlparse(base_url)
        base_path = "/".join(parsed.path.split("/")[:-1])
        return f"{parsed.scheme}://{parsed.netloc}{base_path}/{url}"
    
    return url
