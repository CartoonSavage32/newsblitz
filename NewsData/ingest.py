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


def delete_old_articles():
    """
    Delete articles older than 18 hours to keep DB clean.
    Uses published_at if available, otherwise falls back to created_at.
    Supabase doesn't support COALESCE in delete, so we delete in two passes.
    """
    try:
        # Calculate cutoff: 18 hours ago
        cutoff = datetime.now() - timedelta(hours=18)
        cutoff_iso = cutoff.isoformat()

        deleted_count = 0

        # Pass 1: Delete articles with published_at < cutoff
        result1 = (
            supabase.table("news_articles")
            .delete()
            .lt("published_at", cutoff_iso)
            .execute()
        )
        deleted_count += len(result1.data) if result1.data else 0

        # Pass 2: Delete articles where published_at is NULL and created_at < cutoff
        result2 = (
            supabase.table("news_articles")
            .delete()
            .is_("published_at", "null")
            .lt("created_at", cutoff_iso)
            .execute()
        )
        deleted_count += len(result2.data) if result2.data else 0

        print(f"Deleted {deleted_count} articles older than 18 hours")
        return deleted_count
    except Exception as e:
        print(f"Error deleting old articles: {e}")
        return 0


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
    # Clean up old articles before scraping new ones (18-hour retention)
    delete_old_articles()

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

            # Handle image replacement for .ico files
            if article_image and (article_image.find(".ico") != -1):
                print("replaced_image_url :" + article_image)
                article_image = "https://media.istockphoto.com/id/1409309637/vector/breaking-news-label-banner-isolated-vector-design.jpg?s=2048x2048&w=is&k=20&c=rHMT7lr46TFGxQqLQHvSGD6r79AIeTVng-KYA6J1XKM="

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
                article.top_image,
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
                    article.top_image,
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

    return (
        fallback_content,
        title,
        url,
        None,  # No image available from snippet
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

                # Insert into Supabase
                try:
                    supabase.table("news_articles").insert(
                        {
                            "category": topic,
                            "title": article["title"],
                            "summary": summary,
                            "image_url": article["imgURL"],
                            "source": article["publisher"],
                            "published_at": article["date"],
                            "article_url": article_url,
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
