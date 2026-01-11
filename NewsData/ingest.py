#!/usr/bin/env python3
"""News ingestion pipeline using direct publisher RSS feeds."""

import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import nltk

sys.path.insert(0, ".")

from config.settings import MIN_CONTENT_LENGTH, MIN_TITLE_LENGTH
from extractors.content import extract_content
from extractors.images import extract_image
from fetchers.rss_fetcher import RSSArticle, fetch_all_feeds
from processors.deduplicator import is_duplicate
from processors.lifecycle import manage_lifecycle
from processors.summarizer import summarize
from storage.writer import ArticleData, insert_article

nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)


def process_article(rss_article: RSSArticle) -> bool:
    """Process single article through pipeline."""
    url = rss_article.link

    if is_duplicate(url):
        return False

    content = extract_content(url, rss_article.title, rss_article.snippet)
    if (
        not content
        or len(content.text) < MIN_CONTENT_LENGTH
        or len(content.title) < MIN_TITLE_LENGTH
    ):
        return False

    image_url = extract_image(url)
    summary = summarize(content.text)
    if not summary:
        return False

    success = insert_article(
        ArticleData(
            category=rss_article.category,
            title=content.title,
            summary=summary,
            image_url=image_url,
            source=rss_article.source,
            published_at=rss_article.published_date or content.publish_date,
            article_url=url,
            original_content=content.text,
            snippet=rss_article.snippet,
        )
    )

    if success:
        print(f"  ✓ {content.title[:50]}...")
    return success


def run_ingestion():
    """Run complete ingestion pipeline."""
    start_time = time.time()

    print("=" * 60)
    print("NEWS INGESTION - Direct Publisher RSS")
    print("=" * 60)

    print("\nManaging lifecycle...")
    expired, deleted = manage_lifecycle()
    print(f"  Expired: {expired}, Deleted: {deleted}")

    print("\nFetching RSS feeds...")
    articles = list(fetch_all_feeds())
    print(f"\nTotal articles: {len(articles)}")

    print("\nProcessing...")
    stored = 0

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(process_article, a): a for a in articles}
        for future in as_completed(futures):
            try:
                if future.result():
                    stored += 1
            except Exception as e:
                print(f"  Error: {e}")

    print(f"\n{'=' * 60}")
    print(
        f"Complete: {stored}/{len(articles)} stored in {time.time() - start_time:.1f}s"
    )


if __name__ == "__main__":
    run_ingestion()
