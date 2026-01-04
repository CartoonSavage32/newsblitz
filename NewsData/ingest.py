import json
import os
import re
import time
from datetime import datetime, timedelta
from urllib.parse import urlparse

import newspaper.settings
import nltk
import requests
from dotenv import load_dotenv
from newspaper import Article
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
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

today = datetime.today()
yesterday = today - timedelta(days=1)
yesterday = yesterday.date()
# Global English-only news URLs with hl=en (language), gl=US (region), ceid=US:en (country/language)
topics = {
    "AI": f"https://www.google.com/search?q=AI+news+after:{yesterday}&tbm=nws&hl=en&gl=US&ceid=US:en",
    "Health": f"https://www.google.com/search?q=health+news+after:{yesterday}&tbm=nws&hl=en&gl=US&ceid=US:en",
    "Sports": f"https://www.google.com/search?q=sports+news+after:{yesterday}&tbm=nws&hl=en&gl=US&ceid=US:en",
    "Finance": f"https://www.google.com/search?q=finance+news+after:{yesterday}&tbm=nws&hl=en&gl=US&ceid=US:en",
    "Geopolitical": f"https://www.google.com/search?q=geopolitical+news+after:{yesterday}&tbm=nws&hl=en&gl=US&ceid=US:en",
    "Crypto": f"https://www.google.com/search?q=crypto+news+after:{yesterday}&tbm=nws&hl=en&gl=US&ceid=US:en",
}

chrome_options = Options()
chrome_options.add_argument("--headless=new")  # Use new headless mode
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--disable-blink-features=AutomationControlled")
chrome_options.add_argument("--window-size=1920,1080")
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option("useAutomationExtension", False)
# Updated user agent to recent Chrome version
chrome_options.add_argument(
    "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

start_time = time.time()
news_failed_to_scrape_count = 0


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


def get_news_data():
    # Clean up old articles before scraping new ones (18-hour retention)
    delete_old_articles()

    driver = webdriver.Chrome(options=chrome_options)

    # Execute script to hide webdriver property
    driver.execute_cdp_cmd(
        "Page.addScriptToEvaluateOnNewDocument",
        {
            "source": """
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            })
        """
        },
    )

    def get_news_url(topic_url):
        try:
            driver.get(topic_url)
            # Wait a bit for page to load
            time.sleep(2)

            # Try to handle cookie consent if present
            try:
                # Common cookie consent button selectors
                cookie_selectors = [
                    "button#L2AGLb",  # Google "I agree" button
                    "button[aria-label*='Accept']",
                    "button[aria-label*='I agree']",
                    "button:contains('Accept')",
                ]
                for selector in cookie_selectors:
                    try:
                        cookie_button = WebDriverWait(driver, 2).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                        )
                        cookie_button.click()
                        time.sleep(1)
                        break
                    except Exception:
                        continue
            except Exception:
                pass  # No cookie consent found, continue

            news_results = []
            max_articles = (
                10  # Increased to 10 articles per category for better coverage
            )
            max_pages = 3  # Limit number of pages to scrape to avoid infinite loops

            # Wait for news results with longer timeout
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_all_elements_located(
                        (By.CSS_SELECTOR, "div.SoaBEf, div[data-ved]")
                    )
                )
            except Exception:
                # Try alternative selectors
                try:
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "div.g"))
                    )
                except Exception:
                    print(f"Error loading page with URL: {topic_url}")
                    # Print page source snippet for debugging
                    page_source_preview = (
                        driver.page_source[:500]
                        if driver.page_source
                        else "No page source"
                    )
                    print(f"Page source preview: {page_source_preview}")
                    return []
        except Exception as e:
            print(f"Error loading page with URL: {topic_url} due to {e}")
            return []

        page_count = 0
        while len(news_results) < max_articles and page_count < max_pages:
            # Try multiple selectors for Google News results
            elements = driver.find_elements(By.CSS_SELECTOR, "div.SoaBEf")
            if not elements:
                # Try alternative selector
                elements = driver.find_elements(By.CSS_SELECTOR, "div[data-ved]")
            if not elements:
                # Try generic result selector
                elements = driver.find_elements(By.CSS_SELECTOR, "div.g")

            for el in elements:
                try:
                    # Try to find date element with multiple selectors
                    date_element = None
                    date_selectors = [
                        ".LfVVr",
                        ".OSrXXb",
                        ".fG8Fp",
                        "span[style*='color']",
                    ]
                    for selector in date_selectors:
                        try:
                            date_element = el.find_element(By.CSS_SELECTOR, selector)
                            break
                        except Exception:
                            continue

                    if not date_element:
                        continue

                    news_date_str = date_element.text

                    if (
                        "hours" in news_date_str.lower()
                        or "minutes" in news_date_str.lower()
                        or "hour" in news_date_str.lower()
                        or "minute" in news_date_str.lower()
                    ):
                        # Try to find link
                        link = None
                        try:
                            link = el.find_element(By.TAG_NAME, "a").get_attribute(
                                "href"
                            )
                        except Exception:
                            # Try alternative link selectors
                            try:
                                link = el.find_element(
                                    By.CSS_SELECTOR, "a[href]"
                                ).get_attribute("href")
                            except Exception:
                                continue

                        if not link or link.startswith("javascript:"):
                            continue

                        if link not in [
                            n["link"] for n in news_results
                        ]:  # Avoid duplicates
                            # Try to find title
                            title = ""
                            title_selectors = ["div.MBeuO", "h3", "a h3", ".DKV0Md"]
                            for selector in title_selectors:
                                try:
                                    title = el.find_element(
                                        By.CSS_SELECTOR, selector
                                    ).text
                                    break
                                except Exception:
                                    continue

                            # Try to find snippet
                            snippet = ""
                            snippet_selectors = [".GI74Re", ".Y3v8qd", ".s3v9rd"]
                            for selector in snippet_selectors:
                                try:
                                    snippet = el.find_element(
                                        By.CSS_SELECTOR, selector
                                    ).text
                                    break
                                except Exception:
                                    continue

                            # Try to find source
                            source = ""
                            source_selectors = [".NUnG9d span", ".NUnG9d", ".wEwyrc"]
                            for selector in source_selectors:
                                try:
                                    source = el.find_element(
                                        By.CSS_SELECTOR, selector
                                    ).text
                                    break
                                except Exception:
                                    continue

                            # Light quality filter: skip very short titles or snippets
                            # Google ranking is the primary quality signal, this just filters obvious low-quality
                            if (
                                title
                                and len(title.strip()) >= 10
                                and len(snippet.strip()) >= 20
                            ):
                                news_results.append(
                                    {
                                        "link": link,
                                        "title": title,
                                        "snippet": snippet,
                                        "date": news_date_str,
                                        "source": source,
                                    }
                                )
                    if len(news_results) >= max_articles:
                        return news_results[:max_articles]

                except Exception:
                    # Silently continue - some elements might not match our selectors
                    continue

            # Try to find and click the "Next" button
            try:
                # Scroll to bottom to ensure next button is visible
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1)

                # Try multiple selectors for next button
                next_button = None
                next_selectors = [
                    "a#pnnext",
                    "a[aria-label='Next']",
                    "a[aria-label='Next page']",
                    "td.b a[href*='start=']",
                ]
                for selector in next_selectors:
                    try:
                        next_button = driver.find_element(By.CSS_SELECTOR, selector)
                        break
                    except Exception:
                        continue

                if next_button:
                    driver.execute_script(
                        "arguments[0].scrollIntoView({block: 'center'});", next_button
                    )
                    time.sleep(1)
                    driver.execute_script("arguments[0].click();", next_button)
                    time.sleep(3)  # Wait for next page to load
                    page_count += 1
                else:
                    print("No more pages or 'Next' button not found.")
                    break
            except Exception as e:
                print(f"No more pages or 'Next' button not found: {e}")
                break  # Stop if no "Next" button is found

        return news_results[:max_articles]  # Ensure we return only max_articles

    all_news_data = {}
    for topic, url in topics.items():
        all_news_data[topic] = get_news_url(url)

    # Keep gnews_url.json for debugging (optional)
    with open("gnews_url.json", "w") as f:
        json.dump(all_news_data, f, indent=2)

    detailed_news_data = {}
    with open("gnews_url.json", "r") as file:
        url_data = json.load(file)

    for topic, articles in url_data.items():
        detailed_topic_data = []
        article_count = 0

        for item in articles:
            url = item["link"]
            snippet = item.get("snippet", "")
            title = item.get("title", "")
            source = item.get("source", "")

            # Extract article content with fallback strategy
            (
                article_content,
                article_title,
                article_url,
                article_image,
                article_date,
                publisher,
            ) = extract_article_content(url, snippet, title, source)

            # Skip if no content available or content is too short (quality filter)
            if not article_content or len(article_content) < 50:
                continue

            # Additional quality check: skip if title is too short after extraction
            if not article_title or len(article_title.strip()) < 10:
                continue

            # Handle image replacement for .ico files
            if article_image and (article_image.find(".ico") != -1):
                print("replaced_image_url :" + article_image)
                article_image = "https://media.istockphoto.com/id/1409309637/vector/breaking-news-label-banner-isolated-vector-design.jpg?s=2048x2048&w=is&k=20&c=rHMT7lr46TFGxQqLQHvSGD6r79AIeTVng-KYA6J1XKM="

            news_item = {
                "news_number": article_count,
                "title": article_title,
                "content": article_content,
                "publisher": publisher,
                "url": article_url,
                "imgURL": article_image,
                "date": article_date,
                "snippet": snippet,  # Preserve snippet from Google News
            }

            detailed_topic_data.append(news_item)
            article_count += 1

        detailed_news_data[topic] = detailed_topic_data

    driver.quit()
    print(
        f"Scraping completed. Processing {sum(len(articles) for articles in detailed_news_data.values())} articles"
    )

    summarize_and_store_news(detailed_news_data)  # Call summarization after scraping


def extract_article_content(url, snippet, title, source):
    """
    Extract article content with fallback strategy:
    1. Primary: Newspaper3k download + parse
    2. Secondary: Try reader-mode URLs
    3. Final: Use Google News snippet
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

    # FINAL FALLBACK: Use Google News snippet
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
