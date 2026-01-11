"""Article image extraction."""

import re
import requests
from bs4 import BeautifulSoup
from newspaper import Article

from config.settings import (
    FALLBACK_PLACEHOLDER_IMAGE,
    MIN_IMAGE_WIDTH,
    PUBLISHER_DEFAULT_IMAGES,
    REQUEST_TIMEOUT,
)
from config.sources import BLOCKED_PUBLISHERS
from utils.http import DEFAULT_HEADERS
from utils.urls import get_domain, normalize_url

INVALID_PATTERNS = [
    "logo", "icon", "favicon", "avatar", "sprite", "badge", "brand",
    "apple-touch-icon", "defaultpromocrop", "placeholder",
    "1x1", "pixel", "tracking", "beacon", "analytics", "spacer", "blank", "transparent",
    "google.com", "googleusercontent.com", "gstatic.com",
]


def extract_image(url: str) -> str:
    """Extract best image from article URL."""
    domain = get_domain(url)
    
    for blocked in BLOCKED_PUBLISHERS:
        if blocked in domain:
            return PUBLISHER_DEFAULT_IMAGES.get(blocked, FALLBACK_PLACEHOLDER_IMAGE)
    
    image = _try_newspaper(url)
    if image and _is_valid(image):
        return image
    
    image = _try_html(url)
    if image and _is_valid(image):
        return image
    
    return PUBLISHER_DEFAULT_IMAGES.get(domain, FALLBACK_PLACEHOLDER_IMAGE)


def _try_newspaper(url: str) -> str | None:
    try:
        article = Article(url)
        article.download()
        article.parse()
        return article.top_image
    except Exception:
        return None


def _try_html(url: str) -> str | None:
    try:
        response = requests.get(url, headers=DEFAULT_HEADERS, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
    except Exception:
        return None
    
    for meta in [
        soup.find("meta", property="og:image"),
        soup.find("meta", attrs={"name": "twitter:image"}),
        soup.find("meta", property="article:image"),
    ]:
        if meta and meta.get("content"):
            img = normalize_url(meta["content"], url)
            if _is_valid(img):
                return img
    
    for selector in ["article", "main", ".article-body", "[role='main']"]:
        content = soup.select_one(selector)
        if content:
            for img in content.find_all("img", src=True)[:5]:
                img_url = normalize_url(img.get("src") or img.get("data-src", ""), url)
                if _is_valid(img_url):
                    return img_url
    
    return None


def _is_valid(img_url: str) -> bool:
    if not img_url or img_url.startswith("data:") or img_url.endswith(".ico"):
        return False
    
    img_lower = img_url.lower()
    if any(p in img_lower for p in INVALID_PATTERNS):
        return False
    
    size_match = re.search(r"[?&_x-](?:w|width|size)[=_-]?(\d+)", img_url, re.IGNORECASE)
    if size_match and int(size_match.group(1)) < MIN_IMAGE_WIDTH:
        return False
    
    dim_match = re.search(r"(\d+)x(\d+)", img_url)
    if dim_match:
        w, h = int(dim_match.group(1)), int(dim_match.group(2))
        if w < MIN_IMAGE_WIDTH or h < 200:
            return False
    
    return True
