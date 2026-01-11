#!/usr/bin/env python3
"""Image extraction test for publisher RSS. No Supabase/OpenRouter."""

import sys

sys.path.insert(0, ".")

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import feedparser
import requests
from bs4 import BeautifulSoup
from newspaper import Article

TEST_FEEDS = {
    "BBC": "https://feeds.bbci.co.uk/news/technology/rss.xml",
    "Guardian": "https://www.theguardian.com/technology/rss",
    "CNBC": "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    "NPR": "https://feeds.npr.org/1001/rss.xml",
    "Al Jazeera": "https://www.aljazeera.com/xml/rss/all.xml",
}

INVALID = ["logo", "icon", "favicon", "avatar", "1x1", "pixel", "tracking", "google"]


def is_valid(url: str) -> bool:
    if not url or url.startswith("data:"):
        return False
    return not any(p in url.lower() for p in INVALID)


def extract_image(url: str) -> dict:
    result = {"url": url, "strategy": None, "image": None}

    try:
        article = Article(url)
        article.download()
        article.parse()
        if article.top_image and is_valid(article.top_image):
            return {"url": url, "strategy": "newspaper", "image": article.top_image}
    except Exception:
        pass

    try:
        soup = BeautifulSoup(
            requests.get(
                url, timeout=15, headers={"User-Agent": "Mozilla/5.0"}
            ).content,
            "html.parser",
        )
        og = soup.find("meta", property="og:image")
        if og and og.get("content") and is_valid(og["content"]):
            return {"url": url, "strategy": "og:image", "image": og["content"]}
    except Exception:
        pass

    result["strategy"] = "none"
    return result


def main():
    print("\n" + "=" * 60)
    print("IMAGE EXTRACTION TEST")
    print("=" * 60)

    results = []
    for publisher, feed in TEST_FEEDS.items():
        print(f"\n[{publisher}]")
        try:
            entries = feedparser.parse(feed).entries
            if entries:
                url = entries[0].get("link")
                print(f"  URL: {url[:50]}...")
                r = extract_image(url)
                r["publisher"] = publisher
                results.append(r)
                print(f"  Strategy: {r['strategy']}")
                if r["image"]:
                    print(f"  Image: {r['image'][:50]}...")
        except Exception as e:
            print(f"  Error: {e}")
            results.append({"publisher": publisher, "strategy": "error", "image": None})

    success = sum(1 for r in results if r.get("image"))
    print(f"\n{'=' * 60}")
    print(f"Result: {success}/{len(results)} success")
    for r in results:
        status = "OK" if r.get("image") else "FAIL"
        print(f"  [{status}] {r['publisher']}: {r['strategy']}")


if __name__ == "__main__":
    main()
