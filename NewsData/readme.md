# NewsBlitz Python Ingestion

This directory contains the Python ingestion pipeline that scrapes news articles and stores them in Supabase.

## Overview

The ingestion pipeline:
1. Scrapes Google News using Selenium
2. Extracts article content using Newspaper3k
3. Summarizes articles using OpenRouter API
4. Stores results in Supabase

**Note:** This runs separately from the Next.js frontend. The frontend only reads from Supabase.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in this directory:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SITE_URL=https://your-site.com  # Optional, for OpenRouter
```

### 3. Run Ingestion

```bash
python ingest.py
```

## Scheduling

### Cron Job (Linux/Mac)

```bash
# Run every 3 hours
0 */3 * * * cd /path/to/NewsData && /usr/bin/python3 ingest.py
```

### GitHub Actions

Create `.github/workflows/ingest.yml`:

```yaml
name: Ingest News
on:
  schedule:
    - cron: '0 */3 * * *'  # Every 3 hours
  workflow_dispatch:  # Manual trigger

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd NewsData
          pip install -r requirements.txt
      - name: Run ingestion
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: |
          cd NewsData
          python ingest.py
```

## Architecture

- **Selenium**: Scrapes Google News search results
- **Newspaper3k**: Extracts article content from URLs
- **OpenRouter API**: Generates article summaries
- **Supabase**: Stores articles in PostgreSQL database

## What This Script Does

1. Scrapes Google News for multiple topics (AI, Health, Sports, etc.)
2. Filters for recent articles (hours/minutes ago)
3. Limits to 5 articles per topic
4. Extracts full article content using Newspaper3k
5. Generates summaries using OpenRouter (Gemini Flash model)
6. Stores everything in Supabase `news_articles` table

## Notes

- The scraping logic, selectors, and article processing are **unchanged** from the original implementation
- Only the API call (Ollama → OpenRouter) and storage (JSON files → Supabase) were changed
- All other behavior, filters, and logic remain exactly the same

