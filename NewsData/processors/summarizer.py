"""Article summarization using OpenRouter API."""

import re
import requests
from config.settings import OPENROUTER_API_KEY, OPENROUTER_API_URL

PROMPT = (
    "Summarize the following news article in strictly under 80-100 words while preserving all key details. "
    "The summary should be concise, coherent, and easy to understand. Capture the core facts. "
    "Do not include any additional commentary or meta-text.:\n\n"
)


def summarize(text: str) -> str | None:
    """Summarize article text (80-100 words)."""
    payload = {
        "model": "xiaomi/mimo-v2-flash:free",
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

    try:
        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        text = response.json().get("choices", [{}])[0].get("text", "").strip()
        if not text:
            return None
        return re.sub(r"<think>.*?</think>\s*", "", text, flags=re.DOTALL)
    except Exception as e:
        print(f"  OpenRouter error: {e}")
        return None
