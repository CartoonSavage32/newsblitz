"""Article summarization using OpenRouter API."""

import re
import threading
import time
import requests
from config.settings import OPENROUTER_API_KEY, OPENROUTER_API_URL

PROMPT = (
    "Summarize the following news article in strictly under 80-100 words while preserving all key details. "
    "The summary should be concise, coherent, and easy to understand. Capture the core facts. "
    "Do not include any additional commentary or meta-text.:\n\n"
)

# Rate limit: free tier ~20 req/min → wait between calls (thread-safe)
RATE_LIMIT_DELAY_SEC = 3.5
MAX_RETRIES = 5
INITIAL_BACKOFF_SEC = 2.0

_rate_lock = threading.Lock()
_last_request_time = 0.0


def _wait_for_rate_limit():
    """Ensure minimum delay between requests to avoid 429."""
    with _rate_lock:
        global _last_request_time
        now = time.monotonic()
        wait = _last_request_time + RATE_LIMIT_DELAY_SEC - now
        if wait > 0:
            time.sleep(wait)
        _last_request_time = time.monotonic()


def summarize(text: str) -> str | None:
    """Summarize article text (80-100 words). Retries on 429 with exponential backoff."""
    payload = {
        "model": "liquid/lfm-2.5-1.2b-thinking:free",
        "prompt": PROMPT + text,
        "temperature": 0.3,
        "max_tokens": 200,
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://newsblitz.app",
        "X-Title": "NewsBlitz",
    }

    _wait_for_rate_limit()

    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(
                OPENROUTER_API_URL, json=payload, headers=headers, timeout=30
            )
            if response.status_code in (429, 502, 503):
                if attempt >= MAX_RETRIES - 1:
                    print(
                        f"  OpenRouter error: {response.status_code} after"
                        f" {MAX_RETRIES} attempts"
                    )
                    return None
                retry_after = response.headers.get("Retry-After")
                if retry_after and retry_after.isdigit():
                    wait_sec = float(retry_after)
                else:
                    wait_sec = INITIAL_BACKOFF_SEC * (2**attempt)
                print(
                    f"  OpenRouter {response.status_code}, retry in {wait_sec:.0f}s"
                    f" (attempt {attempt + 1}/{MAX_RETRIES})"
                )
                time.sleep(wait_sec)
                continue
            response.raise_for_status()
            out = response.json().get("choices", [{}])[0].get("text", "").strip()
            if not out:
                return None
            return re.sub(r"<think>.*?</think>\s*", "", out, flags=re.DOTALL)
        except requests.RequestException as e:
            print(f"  OpenRouter error: {e}")
            return None
        except Exception as e:
            print(f"  OpenRouter error: {e}")
            return None
    return None
