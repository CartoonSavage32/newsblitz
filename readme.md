# NewsBlitz

A modern news aggregation app that scrapes, summarizes, and displays news articles from multiple categories.

## Architecture

NewsBlitz uses a **monorepo structure** with:
- **Next.js Frontend** (`Client/`) - React app with App Router, deployed to Vercel
- **Python Ingestion** (`NewsData/`) - Scraping and summarization pipeline, runs on cron/VM/GitHub Actions
- **Supabase** - PostgreSQL database for storing articles
- **OpenRouter API** - AI-powered article summarization

## Quick Start

### Frontend (Next.js)

```bash
cd Client
npm install
npm run dev
```

See `Client/README.md` for detailed setup instructions.

### Ingestion (Python)

```bash
cd NewsData
pip install -r requirements.txt
python ingest.py
```

See `NewsData/README.md` for detailed setup and scheduling instructions.

## Project Structure

```
NewsBlitz/
├── Client/              # Next.js frontend
│   ├── app/             # App Router pages and API routes
│   ├── lib/             # Supabase client and repositories
│   ├── src/             # React components, hooks, utilities
│   └── supabase/        # Database migrations
└── NewsData/            # Python ingestion pipeline
    ├── ingest.py        # Main scraping and summarization script
    └── requirements.txt # Python dependencies
```

## Key Features

- **Multi-category News**: AI, Health, Sports, Finance, Geopolitical, Crypto
- **AI Summarization**: Automatic article summaries using OpenRouter API
- **Real-time Updates**: Fresh news articles scraped every few hours
- **Responsive Design**: Mobile and desktop optimized UI
- **Dark Mode**: Built-in theme support

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Scraping**: Selenium, Newspaper3k
- **AI**: OpenRouter API (Gemini Flash)
- **Database**: Supabase (PostgreSQL)

## Documentation

- `Client/README.md` - Frontend setup and deployment
- `Client/ARCHITECTURE.md` - Detailed architecture documentation
- `NewsData/README.md` - Ingestion pipeline setup and scheduling

## License

MIT

