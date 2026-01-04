# NewsBlitz - Consolidated Architecture

NewsBlitz is a simple news aggregation app with a single Next.js deployment.

## Architecture

- **Frontend**: Next.js App Router (React)
- **Backend**: Next.js API Routes (merged into frontend)
- **Database**: Supabase (PostgreSQL)
- **Summarization**: OpenRouter API
- **Scraping**: Google News RSS

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
INGEST_SECRET=your_random_secret_here

# Email configuration for feedback form (Gmail)
FEEDBACK_EMAIL_USER=your-email@gmail.com
FEEDBACK_EMAIL_APP_PASSWORD=your_gmail_app_password
FEEDBACK_EMAIL_TO=recipient@example.com  # Optional, defaults to FEEDBACK_EMAIL_USER

# SEO & Analytics
NEXT_PUBLIC_SITE_URL=https://your-domain.com  # Required for sitemap, canonical links
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX  # Optional: Google Analytics 4 ID
NEXT_PUBLIC_GOOGLE_VERIFICATION=your_google_verification_code  # Optional: For Google Search Console
```

### 2. Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Run the migration in `supabase/migrations/001_create_news_articles.sql`
3. Copy your project URL and anon key to `.env.local`

### 3. OpenRouter Setup

1. Sign up at https://openrouter.ai
2. Get your API key
3. Add it to `.env.local`

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

## Ingestion

**Note:** Ingestion is handled by a separate Python service. See `NewsData/README.md` for details.

The Python ingestion pipeline:
- Scrapes Google News using Selenium
- Extracts articles using Newspaper3k
- Summarizes using OpenRouter API
- Stores in Supabase

To run ingestion:

```bash
cd NewsData
python3 ingest.py
```

Or set up a cron job:

```bash
# Example: Run every 3 hours
0 */3 * * * cd /path/to/NewsData && python3 ingest.py
```

## API Endpoints

- `GET /api/news` - Get all news articles (grouped by category) - **Read-only from Supabase**
- `GET /api/health` - Health check
- `POST /api/feedback` - Submit feedback (sends email via Nodemailer/Gmail)
- `POST /api/donate` - Dummy donation endpoint (optional)

**Note:** Ingestion is handled by the separate Python service, not via API.

## Project Structure

```
Client/
├── app/
│   ├── api/              # Next.js API routes (read-only from Supabase)
│   ├── layout.tsx        # Root layout
│   └── [pages]/          # Frontend pages
├── lib/
│   ├── supabase/         # Supabase client
│   └── news/             # News repository (read-only)
├── src/
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   ├── Data/             # Data fetching logic
│   └── shared/           # Shared schemas
└── supabase/
    └── migrations/       # Database migrations
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Build and start:

```bash
npm run build
npm start
```

## Migration from Old Architecture

The old architecture had:
- Separate Express backend (`API/` folder)
- Python scraping pipeline (`NewsData/` folder)
- Local JSON file storage

All of this has been consolidated into this single Next.js app.
