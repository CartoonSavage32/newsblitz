import json
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
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


def is_google_image(img_url):
    """Check if image URL is from Google (should be rejected for direct use)."""
    if not img_url:
        return False
    img_lower = img_url.lower()
    google_patterns = [
        "news.google.com",
        "googleusercontent.com",
        "google.com/imgres",
        "lh3.googleusercontent.com",
        "encrypted-tbn",
    ]
    return any(pattern in img_lower for pattern in google_patterns)


def is_valid_article_image(img_url):
    """
    Validate image URL - reject tracking pixels, logos, and Google cached images.
    Used for article-extracted images (strict validation).
    """
    if not img_url:
        return False

    img_lower = img_url.lower()

    # Reject ANY Google-hosted images - we want publisher's own images
    if is_google_image(img_url):
        return False

    # Reject .ico files
    if img_lower.endswith(".ico"):
        return False

    # Reject common logo/icon patterns
    logo_patterns = ["logo", "icon", "avatar", "favicon", "sprite", "badge", "brand"]
    if any(pattern in img_lower for pattern in logo_patterns):
        return False

    # Reject common tracking pixel patterns
    tracking_patterns = [
        "1x1",
        "pixel",
        "tracking",
        "beacon",
        "analytics",
        "spacer",
        "blank",
        "transparent",
        "shim",
    ]
    if any(pattern in img_lower for pattern in tracking_patterns):
        return False

    # Reject very small images based on URL dimensions
    size_match = re.search(
        r"[?&_x-](?:w|width|h|height|size)[=_-]?(\d+)", img_url, re.IGNORECASE
    )
    if size_match:
        size = int(size_match.group(1))
        if size < 300:  # Prefer images >= 300px
            return False

    # Reject images with small dimensions in filename (e.g., thumb_100x100.jpg)
    dim_match = re.search(r"(\d+)x(\d+)", img_url)
    if dim_match:
        w, h = int(dim_match.group(1)), int(dim_match.group(2))
        if w < 300 or h < 200:
            return False

    return True


def extract_image_from_article(url, rss_image_fallback=None):
    """
    Extract the actual article hero/featured image from the source URL.

    Priority order (STRICT - never use Google images directly):
    1. <meta property="og:image"> (most reliable for news sites)
    2. <meta name="twitter:image"> or <meta name="twitter:image:src">
    3. <meta property="article:image"> (some news sites use this)
    4. <link rel="image_src"> (older standard)
    5. First large <img> in article body (>= 300px)
    6. Newspaper3k article.top_image
    7. RSS feed image (only if not a Google image)
    8. Fallback placeholder image

    Args:
        url: The article URL to extract image from
        rss_image_fallback: Optional image URL from RSS feed (may be Google image)

    Filters out:
    - Google News/googleusercontent images (NEVER stored directly)
    - Tracking pixels and small images
    - .ico files and logos
    - Images smaller than 300px
    """
    FALLBACK_PLACEHOLDER = "https://media.istockphoto.com/id/1409309637/vector/breaking-news-label-banner-isolated-vector-design.jpg?s=2048x2048&w=is&k=20&c=rHMT7lr46TFGxQqLQHvSGD6r79AIeTVng-KYA6J1XKM="

    def normalize_image_url(img_url, base_url):
        """Convert relative URLs to absolute URLs."""
        if not img_url:
            return None
        img_url = img_url.strip()
        if img_url.startswith("//"):
            return "https:" + img_url
        elif img_url.startswith("/"):
            parsed = urlparse(base_url)
            return f"{parsed.scheme}://{parsed.netloc}{img_url}"
        elif not img_url.startswith("http"):
            # Relative URL without leading slash
            parsed = urlparse(base_url)
            base_path = "/".join(parsed.path.split("/")[:-1])
            return f"{parsed.scheme}://{parsed.netloc}{base_path}/{img_url}"
        return img_url

    # Try to fetch and parse the page for image extraction
    soup = None
    try:
        response = requests.get(
            url,
            timeout=10,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
    except Exception as e:
        print(f"    Warning: Could not fetch {url[:50]}... for image extraction: {e}")

    if soup:
        # Priority 1: og:image (most reliable for news sites)
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            img_url = normalize_image_url(og_image["content"], url)
            if img_url and is_valid_article_image(img_url):
                return img_url

        # Priority 2: twitter:image (multiple attribute names)
        for attr in [
            {"name": "twitter:image"},
            {"name": "twitter:image:src"},
            {"property": "twitter:image"},
        ]:
            twitter_image = soup.find("meta", attrs=attr)
            if twitter_image and twitter_image.get("content"):
                img_url = normalize_image_url(twitter_image["content"], url)
                if img_url and is_valid_article_image(img_url):
                    return img_url

        # Priority 3: article:image (some publishers use this)
        article_image = soup.find("meta", property="article:image")
        if article_image and article_image.get("content"):
            img_url = normalize_image_url(article_image["content"], url)
            if img_url and is_valid_article_image(img_url):
                return img_url

        # Priority 4: link rel="image_src" (older standard)
        link_image = soup.find("link", rel="image_src")
        if link_image and link_image.get("href"):
            img_url = normalize_image_url(link_image["href"], url)
            if img_url and is_valid_article_image(img_url):
                return img_url

        # Priority 5: First large image in article content (>= 300px)
        content_selectors = [
            "article",
            "main",
            ".article-body",
            ".post-content",
            ".entry-content",
            "[role='main']",
            ".story-body",
            ".article-content",
        ]
        for selector in content_selectors:
            try:
                content = soup.select_one(selector)
                if content:
                    for img in content.find_all("img", src=True)[:5]:
                        img_url = normalize_image_url(
                            img.get("src") or img.get("data-src"), url
                        )
                        if img_url and is_valid_article_image(img_url):
                            # Check if image has reasonable dimensions in attributes
                            width = img.get("width", "0")
                            height = img.get("height", "0")
                            try:
                                w = int(str(width).replace("px", ""))
                                h = int(str(height).replace("px", ""))
                                if w >= 300 or h >= 200:
                                    return img_url
                            except (ValueError, TypeError):
                                # No valid dimensions, accept if URL passes validation
                                return img_url
            except Exception:
                continue

    # Priority 6: Try Newspaper3k as fallback
    try:
        article = Article(url)
        article.download()
        article.parse()
        if article.top_image and is_valid_article_image(article.top_image):
            return article.top_image
    except Exception:
        pass

    # Priority 7: RSS feed image fallback (ONLY if not a Google image)
    if rss_image_fallback and not is_google_image(rss_image_fallback):
        return rss_image_fallback

    # Priority 8: Fallback placeholder (only when no other image available)
    return FALLBACK_PLACEHOLDER


def resolve_google_news_url(google_url):
    """
    Resolve Google News redirect URL to actual article URL.
    Google News RSS feeds return redirect URLs that need to be resolved.

    Google News URL formats:
    - https://news.google.com/rss/articles/... (base64 encoded)
    - https://news.google.com/stories/... (redirect)
    - https://www.google.com/url?... (URL parameter)
    """
    import base64
    from urllib.parse import parse_qs

    # Method 1: Check if URL contains encoded destination in query params
    if "google.com/url" in google_url:
        try:
            parsed = urlparse(google_url)
            params = parse_qs(parsed.query)
            if "url" in params:
                return params["url"][0]
            if "q" in params:
                return params["q"][0]
        except Exception:
            pass

    # Method 2: Try to extract URL from Google News article ID
    # Some Google News URLs contain base64-encoded article info
    if "news.google.com" in google_url and "/articles/" in google_url:
        try:
            # Extract the article ID part
            article_id = google_url.split("/articles/")[-1].split("?")[0]
            # Try to decode (may contain the actual URL)
            decoded = base64.urlsafe_b64decode(article_id + "==").decode(
                "utf-8", errors="ignore"
            )
            # Look for http in decoded content
            if "http" in decoded:
                url_start = decoded.find("http")
                url_end = (
                    decoded.find("\x00", url_start)
                    if "\x00" in decoded[url_start:]
                    else len(decoded)
                )
                potential_url = decoded[url_start:url_end].strip()
                if potential_url.startswith("http"):
                    return potential_url
        except Exception:
            pass

    # Method 3: Follow HTTP redirects
    try:
        response = requests.head(
            google_url,
            allow_redirects=True,
            timeout=15,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
        )
        actual_url = response.url
        # Make sure we didn't just get back a Google URL
        if "google.com" not in actual_url:
            return actual_url
    except Exception:
        pass

    # Method 4: Try GET request and follow redirects
    try:
        response = requests.get(
            google_url,
            allow_redirects=True,
            timeout=15,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
        )
        actual_url = response.url
        if "google.com" not in actual_url:
            return actual_url
    except Exception:
        pass

    # Method 5: Try without redirect following to get Location header
    try:
        response = requests.get(google_url, allow_redirects=False, timeout=10)
        if response.status_code in [301, 302, 303, 307, 308]:
            location = response.headers.get("Location", "")
            if location and "google.com" not in location:
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

                    # Extract RSS image (may be Google image - used as last resort fallback)
                    rss_image = None
                    # Try media:content first (common in RSS feeds)
                    if hasattr(entry, "media_content") and entry.media_content:
                        for media in entry.media_content:
                            if media.get("url"):
                                rss_image = media["url"]
                                break
                    # Try media:thumbnail
                    if not rss_image and hasattr(entry, "media_thumbnail"):
                        for thumb in entry.media_thumbnail:
                            if thumb.get("url"):
                                rss_image = thumb["url"]
                                break
                    # Try enclosure
                    if not rss_image and hasattr(entry, "enclosures"):
                        for enc in entry.enclosures:
                            if enc.get("type", "").startswith("image"):
                                rss_image = enc.get("url")
                                break

                    news_results.append(
                        {
                            "link": link,
                            "title": title,
                            "snippet": snippet,
                            "date": date_str,
                            "source": source,
                            "published_date": published_date,
                            "rss_image": rss_image,  # May be Google image, used as fallback only
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
            rss_image = item.get("rss_image")  # May be Google image, used as fallback

            # Resolve Google News redirect URL to actual article URL
            actual_url = resolve_google_news_url(url)
            if actual_url != url:
                print(f"  Resolved URL: {actual_url[:80]}...")

            # Extract article content with fallback strategy
            # NOTE: Image extraction is done LATER in parallel with summarization
            try:
                (
                    article_content,
                    article_title,
                    article_url,
                    _,  # Image is None here, extracted separately
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
                "actual_url": actual_url,  # Resolved URL for image extraction
                "rss_image": rss_image,  # Fallback image from RSS (may be Google)
                "imgURL": None,  # Will be extracted in parallel with summarization
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

    NOTE: Image extraction is done separately in parallel with summarization.
    This function returns None for image_url - images are extracted later.
    """
    # PRIMARY: Try Newspaper3k normally
    try:
        article = Article(url)
        article.download()
        article.parse()

        if article.text and len(article.text) >= 150:
            return (
                article.text,
                article.title or title,
                article.url or url,
                None,  # Image extracted separately in parallel
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
                return (
                    article.text,
                    article.title or title,
                    url,  # Keep original URL
                    None,  # Image extracted separately in parallel
                    article.publish_date.isoformat() if article.publish_date else None,
                    urlparse(url).netloc.replace("www.", "").split(".")[0],
                )
        except Exception:
            continue  # Try next reader URL

    # FINAL FALLBACK: Use Google News RSS snippet
    fallback_content = f"{title}\n\n{snippet}"
    if source:
        fallback_content = f"{title} ({source})\n\n{snippet}"

    # Extract publisher from URL
    try:
        publisher = urlparse(url).netloc.replace("www.", "").split(".")[0]
    except Exception:
        publisher = source or "Unknown"

    return (
        fallback_content,
        title,
        url,
        None,  # Image extracted separately in parallel
        None,  # No date available from snippet
        publisher,
    )


def summarize_and_store_news(news_data):
    """
    Summarizes content and extracts images IN PARALLEL using ThreadPoolExecutor.
    Stores results in Supabase with deduplication by article_url.

    Pipeline:
    1. For each article, submit both summarization and image extraction to thread pool
    2. Summarization and image fetching run concurrently (don't block each other)
    3. Wait for both to complete, then store in Supabase
    """
    articles_inserted = 0
    # Use 4 workers to balance speed vs rate limiting
    max_workers = 4

    def process_article(topic, article):
        """Process a single article: summarize content and extract image in parallel."""
        content = article["content"]
        if not content:
            return None

        article_url = article["url"]
        actual_url = article.get("actual_url", article_url)
        rss_image = article.get("rss_image")

        # Check for duplicates first (before expensive operations)
        try:
            existing = (
                supabase.table("news_articles")
                .select("id")
                .eq("article_url", article_url)
                .limit(1)
                .execute()
            )
            if existing.data and len(existing.data) > 0:
                print(f"Skipping duplicate article: {article_url[:60]}...")
                return None
        except Exception as e:
            print(f"Warning: Could not check for duplicates: {e}")

        # Run summarization and image extraction in parallel using nested ThreadPoolExecutor
        summary = None
        image_url = None

        with ThreadPoolExecutor(max_workers=2) as inner_executor:
            # Submit both tasks
            summary_future = inner_executor.submit(get_summary_from_openrouter, content)
            image_future = inner_executor.submit(
                extract_image_from_article, actual_url, rss_image
            )

            # Wait for both to complete
            try:
                summary = summary_future.result(timeout=30)
            except Exception as e:
                print(f"  Summarization failed: {e}")

            try:
                image_url = image_future.result(timeout=15)
            except Exception as e:
                print(f"  Image extraction failed: {e}")
                # Use fallback placeholder if image extraction completely fails
                image_url = "https://media.istockphoto.com/id/1409309637/vector/breaking-news-label-banner-isolated-vector-design.jpg?s=2048x2048&w=is&k=20&c=rHMT7lr46TFGxQqLQHvSGD6r79AIeTVng-KYA6J1XKM="

        if not summary:
            return None

        # Prepare article data for insertion
        number = article["news_number"]
        print(f"  ✓ Article {number} of {topic}: summarized + image extracted")

        # Calculate lifecycle timestamps
        published_at = article["date"]
        base_time = (
            datetime.fromisoformat(published_at.replace("Z", "+00:00"))
            if published_at
            else datetime.now()
        )
        expired_at = (base_time + timedelta(hours=48)).isoformat()
        gone_at = (base_time + timedelta(days=7)).isoformat()
        deleted_at = (base_time + timedelta(days=30)).isoformat()

        return {
            "category": topic,
            "title": article["title"],
            "summary": summary,
            "image_url": image_url,
            "source": article["publisher"],
            "published_at": published_at,
            "article_url": article_url,
            "expired": False,
            "expired_at": expired_at,
            "gone_at": gone_at,
            "deleted_at": deleted_at,
            "raw": {
                "news_number": article["news_number"],
                "snippet": article.get("snippet", ""),
                "original_content": content,
            },
        }

    # Process all articles across all topics
    all_articles = []
    for topic, articles in news_data.items():
        for article in articles:
            all_articles.append((topic, article))

    print(
        f"Processing {len(all_articles)} articles (summarization + image extraction in parallel)..."
    )

    # Process articles with thread pool
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(process_article, topic, article): (topic, article)
            for topic, article in all_articles
        }

        for future in as_completed(futures):
            result = future.result()
            if result:
                # Insert into Supabase
                try:
                    supabase.table("news_articles").insert(result).execute()
                    articles_inserted += 1
                except Exception as e:
                    print(f"Error inserting article to Supabase: {e}")

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
