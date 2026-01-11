"""HTTP utilities."""

import requests
from config.settings import REQUEST_TIMEOUT

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}


def fetch_url(url: str, timeout: int = None) -> requests.Response:
    """Fetch a URL with standard headers."""
    return requests.get(url, headers=DEFAULT_HEADERS, timeout=timeout or REQUEST_TIMEOUT)
