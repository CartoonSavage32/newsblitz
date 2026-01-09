import json
import os
import re
import time
from datetime import datetime, timedelta
from urllib.parse import urlparse

import feedparser
import newspaper.settings
import nltk
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from newspaper import Article
from supabase import Client, create_client

# Load environment variables from .env file
load_dotenv()

nltk.download("punkt", quiet=True)

newspaper.settings.DATA_DIRECTORY = os.path.join(os.getcwd(), "newspaper_cache")

# OpenRouter API settings
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY environment variable is required")

# Supabase settings
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError(
        "SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required"
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

start_time = time.time()
news_failed_to_scrape_count = 0

# Google News RSS feed URLs - English, US region, top 10 articles per category
# Format: https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en&num=10
topics = {
    "AI": "https://news.google.com/rss/search?q=AI+news&hl=en-US&gl=US&ceid=US:en&num=10",
    "Health": "https://news.google.com/rss/search?q=health+news&hl=en-US&gl=US&ceid=US:en&num=10",
    "Sports": "https://news.google.com/rss/search?q=sports+news&hl=en-US&gl=US&ceid=US:en&num=10",
    "Finance": "https://news.google.com/rss/search?q=finance+news&hl=en-US&gl=US&ceid=US:en&num=10",
    "Geopolitical": "https://news.google.com/rss/search?q=geopolitical+news&hl=en-US&gl=US&ceid=US:en&num=10",
    "Crypto": "https://news.google.com/rss/search?q=crypto+news&hl=en-US&gl=US&ceid=US:en&num=10",
}


def manage_article_lifecycle():
    """
    Manage article lifecycle based on timestamp fields.

    Lifecycle Stages:
    - ACTIVE: 0 → 48 hours (now < expired_at)
      - expired = false
      - Included in sitemap-articles.xml
      - HTTP 200

    - EXPIRED: 48 hours → 7 days (expired_at ≤ now < gone_at)
      - expired = true
      - Removed from sitemap
      - HTTP 200 with archived UI

    - GONE: 7 → 30 days (gone_at ≤ now < deleted_at)
      - Article still exists in DB
      - Return HTTP 410 Gone
      - Add meta robots: noindex, follow

    - HARD DELETE: 30+ days (now ≥ deleted_at)
      - Physically delete row from DB

    Why this approach?
    - Google may have indexed these articles and will try to crawl them again
    - Returning 404 for previously indexed content hurts SEO and wastes crawl budget
    - 410 (Gone) status is better for deindexing than 404
    - Keeping articles for 30 days allows proper Google deindexing
    """
    try:
        now = datetime.now()
        now_iso = now.isoformat()

        expired_count = 0
        deleted_count = 0

        # Step 1: Mark articles as expired where now >= expired_at (48+ hours old)
        # Update expired boolean for articles that have passed their expired_at time
        result1 = (
            supabase.table("news_articles")
            .update({"expired": True})
            .lt("expired_at", now_iso)
            .eq("expired", False)
            .execute()
        )
        expired_count += len(result1.data) if result1.data else 0

        # Fallback: For articles without expired_at, use 48-hour cutoff from published_at
        expired_cutoff = now - timedelta(hours=48)
        expired_cutoff_iso = expired_cutoff.isoformat()

        result2 = (
            supabase.table("news_articles")
            .update({"expired": True})
            .is_("expired_at", "null")
            .lt("published_at", expired_cutoff_iso)
            .eq("expired", False)
            .execute()
        )
        expired_count += len(result2.data) if result2.data else 0

        # Step 2: Permanently delete articles where now >= deleted_at (30+ days old)
        # These articles have been in GONE state and can now be removed
        result3 = (
            supabase.table("news_articles").delete().lt("deleted_at", now_iso).execute()
        )
        deleted_count += len(result3.data) if result3.data else 0

        # Fallback: For articles without deleted_at, use 30-day cutoff
        delete_cutoff = now - timedelta(days=30)
        delete_cutoff_iso = delete_cutoff.isoformat()

        result4 = (
            supabase.table("news_articles")
            .delete()
            .is_("deleted_at", "null")
            .lt("published_at", delete_cutoff_iso)
            .execute()
        )
        deleted_count += len(result4.data) if result4.data else 0

        # Fallback for articles with NULL published_at
        result5 = (
            supabase.table("news_articles")
            .delete()
            .is_("deleted_at", "null")
            .is_("published_at", "null")
            .lt("created_at", delete_cutoff_iso)
            .execute()
        )
        deleted_count += len(result5.data) if result5.data else 0

        print(f"Marked {expired_count} articles as expired (48+ hours old)")
        print(f"Hard deleted {deleted_count} articles (30+ days old)")
        return expired_count, deleted_count
    except Exception as e:
        print(f"Error managing article lifecycle: {e}")
        return 0, 0


def extract_image_from_article(url):
    """
    Extract article image from metadata tags with priority:
    1. <meta property="og:image">
    2. <meta name="twitter:image">
    3. Newspaper3k article.top_image
    4. Fallback placeholder image

    Rejects images that:
    - End with .ico
    - Are tracking pixels (1x1, very small)
    - Are smaller than 300x300 (if size detectable)
    """
    FALLBACK_IMAGE = "https://media.istockphoto.com/id/1409309637/vector/breaking-news-label-banner-isolated-vector-design.jpg?s=2048x2048&w=is&k=20&c=rHMT7lr46TFGxQqLQHvSGD6r79AIeTVng-KYA6J1XKM="

    def is_valid_image(img_url):
        """Validate image URL - reject .ico, tracking pixels, and small images."""
        if not img_url:
            return False

        # Reject .ico files
        if img_url.lower().endswith(".ico"):
            return False

        # Reject common tracking pixel patterns
        tracking_patterns = ["1x1", "pixel", "tracking", "beacon", "analytics"]
        img_lower = img_url.lower()
        if any(pattern in img_lower for pattern in tracking_patterns):
            return False

        # Try to check image size if URL contains dimensions
        # Some CDNs include size in URL (e.g., image.jpg?w=100&h=100)
        size_match = re.search(r"[?&](?:w|width|h|height)=(\d+)", img_url)
        if size_match:
            size = int(size_match.group(1))
            if size < 300:
                return False

        return True

    # Priority 1: Try og:image meta tag
    try:
        response = requests.get(
            url,
            timeout=10,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
            },
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")

        # Check og:image
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            img_url = og_image["content"]
            # Handle relative URLs
            if img_url.startswith("//"):
                img_url = "https:" + img_url
            elif img_url.startswith("/"):
                parsed = urlparse(url)
                img_url = f"{parsed.scheme}://{parsed.netloc}{img_url}"

            if is_valid_image(img_url):
                return img_url

        # Priority 2: Try twitter:image
        twitter_image = soup.find("meta", attrs={"name": "twitter:image"})
        if twitter_image and twitter_image.get("content"):
            img_url = twitter_image["content"]
            # Handle relative URLs
            if img_url.startswith("//"):
                img_url = "https:" + img_url
            elif img_url.startswith("/"):
                parsed = urlparse(url)
                img_url = f"{parsed.scheme}://{parsed.netloc}{img_url}"

            if is_valid_image(img_url):
                return img_url
    except Exception:
        pass  # Fall through to Newspaper3k

    # Priority 3: Try Newspaper3k
    try:
        article = Article(url)
        article.download()
        article.parse()
        if article.top_image and is_valid_image(article.top_image):
            return article.top_image
    except Exception:
        pass  # Fall through to fallback

    # Priority 4: Fallback placeholder
    return FALLBACK_IMAGE


def resolve_google_news_url(google_url):
    """
    Resolve Google News redirect URL to actual article URL.
    Google News RSS feeds return redirect URLs that need to be resolved.
    """
    try:
        # Follow redirects to get actual URL
        response = requests.head(google_url, allow_redirects=True, timeout=10)
        actual_url = response.url
        return actual_url
    except Exception:
        # If HEAD fails, try GET with no redirect following to extract URL
        try:
            response = requests.get(google_url, allow_redirects=False, timeout=10)
            if response.status_code in [301, 302, 303, 307, 308]:
                location = response.headers.get("Location", "")
                if location:
                    return location
        except Exception:
            pass
    # If all else fails, return original URL
    return google_url


def get_news_data():
    """
    Fetch news articles from Google News RSS feeds.
    Returns dictionary with category as key and list of articles as value.
    """
    # Manage article lifecycle:
    # - Mark articles as expired after 48 hours
    # - Hard delete articles after 30 days
    manage_article_lifecycle()

    all_news_data = {}

    for topic, rss_url in topics.items():
        print(f"Fetching {topic} news from RSS feed...")
        try:
            # Parse RSS feed
            feed = feedparser.parse(rss_url)

            if feed.bozo and feed.bozo_exception:
                print(f"Error parsing RSS feed for {topic}: {feed.bozo_exception}")
                all_news_data[topic] = []
                continue

            news_results = []
            max_articles = 10

            # Extract articles from RSS feed
            for entry in feed.entries[:max_articles]:
                try:
                    # Extract link - Google News RSS links are redirect URLs, extract actual URL
                    link = entry.get("link", "")
                    if not link:
                        continue

                    # Extract title
                    title = entry.get("title", "").strip()
                    if not title or len(title) < 10:
                        continue

                    # Extract snippet/description
                    snippet = ""
                    if hasattr(entry, "summary"):
                        snippet = entry.get("summary", "").strip()
                    elif hasattr(entry, "description"):
                        snippet = entry.get("description", "").strip()

                    # Extract source/publisher
                    source = ""
                    if hasattr(entry, "source"):
                        source = entry.get("source", {}).get("title", "").strip()
                    elif hasattr(entry, "author"):
                        source = entry.get("author", "").strip()

                    # Extract published date
                    published_date = None
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        try:
                            published_date = datetime(*entry.published_parsed[:6])
                            published_date = published_date.isoformat()
                        except Exception:
                            pass

                    # Extract date string for display
                    date_str = ""
                    if hasattr(entry, "published"):
                        date_str = entry.get("published", "")

                    # Quality filter: skip very short titles or snippets
                    if len(snippet.strip()) < 20:
                        continue

                    news_results.append(
                        {
                            "link": link,
                            "title": title,
                            "snippet": snippet,
                            "date": date_str,
                            "source": source,
                            "published_date": published_date,
                        }
                    )
                except Exception as e:
                    print(f"Error processing RSS entry for {topic}: {e}")
                    continue

            all_news_data[topic] = news_results[:max_articles]
            print(f"Fetched {len(news_results)} articles for {topic}")

        except Exception as e:
            print(f"Error fetching RSS feed for {topic}: {e}")
            all_news_data[topic] = []

    # Keep gnews_url.json for debugging (optional)
    with open("gnews_url.json", "w") as f:
        json.dump(all_news_data, f, indent=2)

    detailed_news_data = {}
    with open("gnews_url.json", "r") as file:
        url_data = json.load(file)

    for topic, articles in url_data.items():
        detailed_topic_data = []
        article_count = 0
        print(f"Processing {len(articles)} articles for {topic}...")

        for item in articles:
            url = item["link"]
            snippet = item.get("snippet", "")
            title = item.get("title", "")
            source = item.get("source", "")
            published_date = item.get("published_date")

            # Resolve Google News redirect URL to actual article URL
            actual_url = resolve_google_news_url(url)
            if actual_url != url:
                print(f"  Resolved URL: {actual_url[:80]}...")

            # Extract article content with fallback strategy
            try:
                (
                    article_content,
                    article_title,
                    article_url,
                    article_image,
                    article_date,
                    publisher,
                ) = extract_article_content(actual_url, snippet, title, source)
            except Exception as e:
                print(f"  Error extracting content from {title[:50]}...: {e}")
                continue

            # Skip if no content available or content is too short (quality filter)
            if not article_content or len(article_content) < 50:
                print(
                    f"  Skipped: Content too short or empty ({len(article_content) if article_content else 0} chars)"
                )
                continue

            # Additional quality check: skip if title is too short after extraction
            if not article_title or len(article_title.strip()) < 10:
                print(
                    f"  Skipped: Title too short ({len(article_title.strip()) if article_title else 0} chars)"
                )
                continue

            # Image validation is already handled in extract_image_from_article()
            # No need for additional .ico check here

            # Use published_date from RSS if available, otherwise use extracted date
            final_date = None
            if published_date:
                final_date = published_date  # Already in ISO format
            elif article_date:
                final_date = article_date

            news_item = {
                "news_number": article_count,
                "title": article_title,
                "content": article_content,
                "publisher": publisher,
                "url": article_url,
                "imgURL": article_image,
                "date": final_date,
                "snippet": snippet,  # Preserve snippet from Google News RSS
            }

            detailed_topic_data.append(news_item)
            article_count += 1
            print(f"  ✓ Added article {article_count} for {topic}")

        detailed_news_data[topic] = detailed_topic_data
        print(f"Completed {topic}: {len(detailed_topic_data)} articles processed")

    print(
        f"Scraping completed. Processing {sum(len(articles) for articles in detailed_news_data.values())} articles"
    )

    summarize_and_store_news(detailed_news_data)  # Call summarization after scraping


def extract_article_content(url, snippet, title, source):
    """
    Extract article content with fallback strategy:
    1. Primary: Newspaper3k download + parse
    2. Secondary: Try reader-mode URLs
    3. Final: Use Google News RSS snippet

    Images are extracted separately using extract_image_from_article().
    """
    article_image = None

    # PRIMARY: Try Newspaper3k normally
    try:
        article = Article(url)
        article.download()
        article.parse()

        if article.text and len(article.text) >= 150:
            # Extract image using priority-based method
            article_image = extract_image_from_article(url)

            return (
                article.text,
                article.title or title,
                article.url or url,
                article_image,
                article.publish_date.isoformat() if article.publish_date else None,
                urlparse(article.url or url).netloc.replace("www.", "").split(".")[0],
            )
    except Exception:
        pass  # Fall through to secondary strategy

    # SECONDARY: Try reader-mode URLs
    reader_urls = [
        f"{url}?amp",
        f"https://textise.net/showText.aspx?strURL={url}",
    ]

    for reader_url in reader_urls:
        try:
            article = Article(reader_url)
            article.download()
            article.parse()

            if article.text and len(article.text) >= 150:
                # Extract image using priority-based method (use original URL, not reader URL)
                article_image = extract_image_from_article(url)

                return (
                    article.text,
                    article.title or title,
                    url,  # Keep original URL
                    article_image,
                    article.publish_date.isoformat() if article.publish_date else None,
                    urlparse(url).netloc.replace("www.", "").split(".")[0],
                )
        except Exception:
            continue  # Try next reader URL

    # FINAL FALLBACK: Use Google News RSS snippet
    # Combine snippet with title and source for better context
    fallback_content = f"{title}\n\n{snippet}"
    if source:
        fallback_content = f"{title} ({source})\n\n{snippet}"

    # Extract publisher from URL
    try:
        publisher = urlparse(url).netloc.replace("www.", "").split(".")[0]
    except Exception:
        publisher = source or "Unknown"

    # Try to extract image even for fallback content
    article_image = extract_image_from_article(url)

    return (
        fallback_content,
        title,
        url,
        article_image,  # Use extracted image or fallback placeholder
        None,  # No date available from snippet
        publisher,
    )


def summarize_and_store_news(news_data):
    """
    Summarizes the content using OpenRouter and stores in Supabase.
    Includes deduplication by article_url before insert.
    """
    articles_inserted = 0

    for topic, articles in news_data.items():
        for article in articles:
            content = article["content"]
            if not content:
                continue

            summary = get_summary_from_openrouter(content)
            if summary:
                article["content"] = summary  # Replace content with summary
                number = article["news_number"]
                print(f"article number {number} of topic {topic} summarised")

                # Deduplication: Check if article_url already exists before inserting
                article_url = article["url"]
                try:
                    existing = (
                        supabase.table("news_articles")
                        .select("id")
                        .eq("article_url", article_url)
                        .limit(1)
                        .execute()
                    )
                    if existing.data and len(existing.data) > 0:
                        print(f"Skipping duplicate article: {article_url}")
                        continue
                except Exception as e:
                    # If check fails, continue anyway (don't block ingestion)
                    print(f"Warning: Could not check for duplicates: {e}")

                # Insert into Supabase with lifecycle timestamps
                # Lifecycle: expired_at = +48h, gone_at = +7d, deleted_at = +30d
                try:
                    # Calculate lifecycle timestamps from published_at
                    published_at = article["date"]
                    base_time = (
                        datetime.fromisoformat(published_at.replace("Z", "+00:00"))
                        if published_at
                        else datetime.now()
                    )
                    expired_at = (base_time + timedelta(hours=48)).isoformat()
                    gone_at = (base_time + timedelta(days=7)).isoformat()
                    deleted_at = (base_time + timedelta(days=30)).isoformat()

                    supabase.table("news_articles").insert(
                        {
                            "category": topic,
                            "title": article["title"],
                            "summary": summary,
                            "image_url": article["imgURL"],
                            "source": article["publisher"],
                            "published_at": published_at,
                            "article_url": article_url,
                            "expired": False,  # Initially not expired
                            "expired_at": expired_at,
                            "gone_at": gone_at,
                            "deleted_at": deleted_at,
                            "raw": {
                                "news_number": article["news_number"],
                                "snippet": article.get("snippet", ""),
                                "original_content": content,  # Store original article text before summarization
                            },
                        }
                    ).execute()
                    articles_inserted += 1
                except Exception as e:
                    print(f"Error inserting article to Supabase: {e}")
                    continue

    print(
        f"Summarization and storage completed. Inserted {articles_inserted} articles into Supabase"
    )
    print(f"Time taken for execution: {time.time() - start_time:.2f} seconds")


def get_summary_from_openrouter(text):
    """
    Replaces Ollama call with OpenRouter API call.
    Same prompt, same word limits (80-100 words), same behavior.
    """
    prompt = (
        "Summarize the following news article in strictly under 80-100 words while preserving all key details and ensuring readability for a general audience. "
        "The summary should be concise, coherent, and easy to understand. Capture the core facts, context, and any important quotes or statistics."
        "Do not leave out critical information that affects the overall meaning of the article."
        "rewrite the content in your own words while preserving accuracy"
        "Make it engaging by using a compelling hook, essential facts, and a clear structure"
        "the summary should be strictly under 80-100 words"
        "Do not include any additional commentary, reasoning, or meta-text.:\n\n "
        f"{text}"
    )

    payload = {
        "model": "xiaomi/mimo-v2-flash:free",  # Free/low-cost model
        "prompt": prompt,
        "temperature": 0.3,
        "max_tokens": 200,
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("SITE_URL", "https://newsblitz.app"),
        "X-Title": "NewsBlitz Article Summarization",
    }

    try:
        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        response_data = response.json()
        response_text = response_data.get("choices", [{}])[0].get("text", "").strip()

        if not response_text:
            print("Empty response from OpenRouter")
            return None

        # Remove reasoning tags if present (OpenRouter may return <think> tags)
        cleaned_summary = re.sub(
            r"<think>.*?</think>\s*", "", response_text, flags=re.DOTALL
        )
        # Also remove <think> if present (for compatibility)
        cleaned_summary = re.sub(
            r"<think>.*?</think>\s*", "", cleaned_summary, flags=re.DOTALL
        )

        return cleaned_summary
    except Exception as e:
        print(f"Error communicating with OpenRouter: {e}")
        return None


if __name__ == "__main__":
    get_news_data()
