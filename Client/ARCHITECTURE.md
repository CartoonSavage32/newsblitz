# NewsBlitz Architecture

## Overview

NewsBlitz uses a **Python ingestion pipeline** that runs separately from the Next.js frontend. The frontend only reads from Supabase.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│              Python Ingestion Service                    │
│  (Runs on cron / VM / GitHub Actions)                   │
│                                                         │
│  Selenium → Google News → Newspaper3k → OpenRouter     │
│                    ↓                                    │
│                 Supabase                                │
└─────────────────────────────────────────────────────────┘
                        ↑
                        │
┌─────────────────────────────────────────────────────────┐
│              Next.js Frontend (Vercel)                  │
│                                                         │
│  Frontend → GET /api/news → Supabase (read-only)       │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Ingestion Flow (Python)

```
Google News (Selenium) → Article URLs → Newspaper3k → Article Content → OpenRouter → Supabase
```

1. **Selenium Scraping** (`NewsData/ingest.py`)
   - Uses Chrome headless browser
   - Scrapes Google News search results
   - Filters for recent articles (hours/minutes ago)
   - Selects articles using exact same selectors as before
   - Limits to 5 articles per topic

2. **Article Extraction** (Newspaper3k)
   - Downloads full article HTML
   - Parses content using Newspaper3k
   - Extracts title, text, images
   - Replaces .ico images with default
   - Filters articles with < 100 chars

3. **Summarization** (OpenRouter API)
   - Sends article text to OpenRouter
   - Uses Gemini Flash model
   - Same prompt as before (80-100 words)
   - Removes reasoning tags if present

4. **Storage** (Supabase)
   - Inserts directly into `news_articles` table
   - Stores raw data in JSONB column
   - Uses service role key for writes

### 2. Frontend Flow (Next.js)

```
User → Frontend → GET /api/news → Supabase (read-only) → Display
```

1. **Frontend** requests news via TanStack Query
2. **API Route** (`app/api/news/route.ts`) queries Supabase
3. **Repository** (`lib/news/repository.ts`) handles database operations
4. **Response** grouped by category for frontend consumption

## Key Components

### Python Ingestion (`NewsData/ingest.py`)

- **Selenium scraping** - Unchanged from original
- **Newspaper3k parsing** - Unchanged from original
- **OpenRouter summarization** - Replaced Ollama API call only
- **Supabase storage** - Replaced JSON file writes

### Next.js API Routes (`app/api/`)

- `news/route.ts` - GET all news articles (read-only from Supabase)
- `health/route.ts` - Health check
- `feedback/route.ts` - Submit feedback (optional)
- `donate/route.ts` - Dummy donation endpoint (optional)

**NO scraping or summarization in Next.js**

### Libraries (`lib/`)

- `supabase/client.ts` - Supabase client (read-only for frontend)
- `news/repository.ts` - Database operations (read-only)

## Database Schema

### `news_articles` Table

```sql
- id (UUID, primary key)
- category (TEXT) - e.g., "AI", "Health", "Sports"
- title (TEXT)
- summary (TEXT) - AI-generated summary (80-100 words)
- image_url (TEXT, nullable)
- source (TEXT) - Publisher name
- published_at (TIMESTAMPTZ, nullable)
- article_url (TEXT) - Original article URL
- raw (JSONB) - Original scraped data
- created_at (TIMESTAMPTZ) - Auto-generated
```

## Environment Variables

### Python Ingestion

- `OPENROUTER_API_KEY` - OpenRouter API key (required)
- `SUPABASE_URL` - Supabase project URL (required)
- `SUPABASE_SERVICE_KEY` - Supabase service role key (required)
- `SITE_URL` - Site URL for OpenRouter (optional)

### Next.js Frontend

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (read-only)

## Deployment

### Python Ingestion

Run on:
- **Cron VM** - Scheduled execution
- **GitHub Actions** - Scheduled workflows
- **Separate server** - Continuous loop

Example cron:
```bash
0 */3 * * * cd /path/to/NewsData && python3 ingest.py
```

### Next.js Frontend

Deploy to:
- **Vercel** (recommended)
- **Netlify**
- **Any Node.js hosting**

## What Changed (Maintainability Only)

### Kept Exactly the Same

- ✅ Selenium scraping logic
- ✅ Google News URLs and selectors
- ✅ Pagination logic
- ✅ Newspaper3k article parsing
- ✅ Image replacement logic
- ✅ Summary length rules (80-100 words)
- ✅ Topic structure
- ✅ Article selection criteria
- ✅ Retry behavior

### Changed Only

- ✅ `get_summary_from_ollama` → `get_summary_from_openrouter` (API call only)
- ✅ JSON file writes → Supabase inserts
- ✅ Removed Express backend (merged into Next.js)
- ✅ Frontend now reads from Supabase instead of Express API

## Security

- Python uses **service role key** (write access)
- Frontend uses **anon key** (read-only)
- RLS policies on database
- No authentication required (public news app)
