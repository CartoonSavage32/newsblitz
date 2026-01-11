"""RSS feed fetching and parsing."""

import re
from dataclasses import dataclass
from datetime import datetime
from typing import Generator

import feedparser

from config.settings import MAX_ARTICLES_PER_FEED
from config.sources import RSS_FEEDS
from utils.urls import is_aggregator_url


@dataclass
class RSSArticle:
    title: str
    link: str
    snippet: str
    published_date: str | None
    source: str
    category: str


def fetch_all_feeds() -> Generator[RSSArticle, None, None]:
    """Fetch all configured RSS feeds."""
    for category, feeds in RSS_FEEDS.items():
        print(f"\nFetching {category} feeds...")
        for source_name, feed_url in feeds:
            print(f"  {source_name}...")
            articles = _fetch_feed(feed_url, source_name, category)
            print(f"    Found {len(articles)} articles")
            yield from articles


def _fetch_feed(feed_url: str, source_name: str, category: str) -> list[RSSArticle]:
    """Fetch and parse a single RSS feed."""
    articles = []
    
    try:
        feed = feedparser.parse(feed_url)
        if feed.bozo and feed.bozo_exception:
            print(f"  Warning: {source_name}: {feed.bozo_exception}")
        
        for entry in feed.entries[:MAX_ARTICLES_PER_FEED]:
            article = _parse_entry(entry, source_name, category)
            if article:
                articles.append(article)
    except Exception as e:
        print(f"  Error fetching {source_name}: {e}")
    
    return articles


def _parse_entry(entry, source_name: str, category: str) -> RSSArticle | None:
    """Parse RSS entry into RSSArticle."""
    link = entry.get("link", "")
    if not link or is_aggregator_url(link):
        return None
    
    title = entry.get("title", "").strip()
    if not title or len(title) < 10:
        return None
    
    snippet = entry.get("summary", "") or entry.get("description", "")
    snippet = re.sub(r"<[^>]+>", "", snippet)
    snippet = re.sub(r"\s+", " ", snippet).strip()
    
    published_date = None
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        try:
            published_date = datetime(*entry.published_parsed[:6]).isoformat()
        except Exception:
            pass
    
    return RSSArticle(
        title=title,
        link=link,
        snippet=snippet,
        published_date=published_date,
        source=source_name,
        category=category,
    )
