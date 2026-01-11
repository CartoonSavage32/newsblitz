"""Publisher RSS feed sources. Direct feeds only - no aggregators."""

RSS_FEEDS = {
    "AI": [
        ("BBC Technology", "https://feeds.bbci.co.uk/news/technology/rss.xml"),
        ("The Guardian Tech", "https://www.theguardian.com/technology/rss"),
        ("Ars Technica", "https://feeds.arstechnica.com/arstechnica/technology-lab"),
        ("Wired", "https://www.wired.com/feed/rss"),
        ("MIT Technology Review", "https://www.technologyreview.com/feed/"),
    ],
    "Health": [
        ("BBC Health", "https://feeds.bbci.co.uk/news/health/rss.xml"),
        ("NPR Health", "https://feeds.npr.org/1128/rss.xml"),
        ("The Guardian Health", "https://www.theguardian.com/society/health/rss"),
        ("WebMD", "https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC"),
    ],
    "Sports": [
        ("BBC Sport", "https://feeds.bbci.co.uk/sport/rss.xml"),
        ("ESPN", "https://www.espn.com/espn/rss/news"),
        ("The Guardian Sport", "https://www.theguardian.com/sport/rss"),
        ("CBS Sports", "https://www.cbssports.com/rss/headlines/"),
    ],
    "Finance": [
        ("CNBC", "https://www.cnbc.com/id/100003114/device/rss/rss.html"),
        ("BBC Business", "https://feeds.bbci.co.uk/news/business/rss.xml"),
        ("The Guardian Business", "https://www.theguardian.com/business/rss"),
        ("MarketWatch", "https://feeds.marketwatch.com/marketwatch/topstories/"),
    ],
    "Geopolitical": [
        ("BBC World", "https://feeds.bbci.co.uk/news/world/rss.xml"),
        ("Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml"),
        ("The Guardian World", "https://www.theguardian.com/world/rss"),
        ("NPR World", "https://feeds.npr.org/1004/rss.xml"),
        ("AP News", "https://rsshub.app/apnews/topics/world-news"),
    ],
    "Crypto": [
        ("CoinDesk", "https://www.coindesk.com/arc/outboundfeeds/rss/"),
        ("Cointelegraph", "https://cointelegraph.com/rss"),
        ("The Block", "https://www.theblock.co/rss.xml"),
        ("Decrypt", "https://decrypt.co/feed"),
    ],
}

BLOCKED_URL_PATTERNS = [
    "news.google.com",
    "google.com/url",
    "googleusercontent.com",
    "yahoo.com/news",
    "bing.com/news",
    "msn.com/en-us/news",
    "apple.news",
    "flipboard.com",
]

BLOCKED_PUBLISHERS = [
    "reuters.com",
    "bloomberg.com",
    "wsj.com",
    "ft.com",
]
