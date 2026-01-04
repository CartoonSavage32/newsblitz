# NewsBlitz Frontend

A modern Next.js news aggregation application with AI-powered summaries, built with React, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack Query (React Query)
- **Database**: Supabase (PostgreSQL)
- **Email**: Nodemailer (Gmail SMTP)
- **Analytics**: Google Analytics 4
- **Type Safety**: TypeScript

## Features

- 📰 **News Aggregation**: Browse news from multiple categories (AI, Health, Sports, Finance, Geopolitical, Crypto)
- 🤖 **AI Summaries**: Concise, AI-generated summaries of news articles
- 📱 **Responsive Design**: Optimized for both desktop and mobile devices
- 🎨 **Dark Mode**: Built-in theme switching
- 🔍 **SEO Optimized**: Dynamic article pages, sitemap, structured data
- 📧 **Feedback Form**: Contact form with email delivery
- 🎯 **Category Filtering**: Filter news by category with instant updates.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- (Optional) Gmail account for feedback emails
- (Optional) Google Analytics 4 account

### Installation

1. **Install dependencies**

```bash
npm install
```

2. **Set up environment variables**

Create a `.env.local` file in the `Client` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Configuration (Optional - for feedback form)
FEEDBACK_EMAIL_USER=your-email@gmail.com
FEEDBACK_EMAIL_APP_PASSWORD=your_gmail_app_password
FEEDBACK_EMAIL_TO=recipient@example.com  # Optional, defaults to FEEDBACK_EMAIL_USER

# SEO & Analytics (Optional)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_VERIFICATION=your_verification_code
```

3. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Client/
├── app/                    # Next.js App Router (routes, layouts, pages)
│   ├── api/               # API routes
│   │   ├── feedback/     # Feedback form endpoint
│   │   ├── health/        # Health check
│   │   └── news/          # News articles endpoint
│   ├── news/              # News pages
│   │   ├── [slug]/        # Dynamic article pages (SEO)
│   │   └── page.tsx       # News listing page
│   ├── feedback/          # Feedback form page
│   ├── layout.tsx         # Root layout with GA4
│   ├── page.tsx           # Homepage
│   ├── robots.ts          # Robots.txt generator
│   └── sitemap.ts         # Sitemap generator
│
├── components/             # All React components
│   ├── ui/                 # Reusable UI components (buttons, cards, etc.)
│   ├── layout/             # Navbar, footer, wrappers
│   ├── news/               # News-specific components
│   └── shared/             # Cross-feature reusable components
│
├── hooks/                  # All custom React hooks
│
├── lib/                    # Business logic & integrations
│   ├── api.ts              # API base URLs and helpers
│   ├── supabase.ts         # Supabase client
│   ├── analytics.ts        # GA / tracking helpers
│   ├── utils.ts            # Generic helpers
│   ├── news/               # News repository (Supabase)
│   └── supabase/           # Supabase client
│
├── data/                   # Static or mock data
│
├── styles/                 # Global styles
│   └── globals.css
│
├── public/                 # Static assets
│
├── middleware.ts
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

### Where to Add New Code

- **New Components**: Add to `components/` organized by purpose:
  - `components/ui/` - Reusable UI primitives (buttons, inputs, etc.)
  - `components/layout/` - Layout components (navbar, footer)
  - `components/news/` - News-specific components
  - `components/shared/` - Cross-feature components

- **New Hooks**: Add to `hooks/` directory (e.g., `hooks/useCustomHook.ts`)

- **New API Logic**: Add to `lib/` directory:
  - `lib/api.ts` - API configuration
  - `lib/analytics.ts` - Tracking utilities
  - `lib/utils.ts` - Generic utilities

- **New Data Fetching**: Add to `data/` directory or create hooks in `hooks/`

### Data Flow

1. **Database → API**: Articles are fetched from Supabase via `/api/news`
2. **API → Hooks**: Data is fetched using React Query hooks (e.g., `useNews()`)
3. **Hooks → Components**: Components consume data from hooks
4. **Components → UI**: Components render articles with proper linking
5. **SEO**: Article pages are server-rendered for optimal search engine indexing

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Key Features Implementation

### SEO Optimization

- **Dynamic Article Pages**: Each article has its own SEO-friendly URL (`/news/[slug]`)
- **Structured Data**: JSON-LD Schema.org markup for articles
- **Sitemap**: Auto-generated sitemap at `/sitemap.xml`
- **Robots.txt**: Configured at `/robots.txt`
- **Meta Tags**: OpenGraph and Twitter Cards for social sharing

### Responsive Design

- **Desktop**: Full-width carousel with side-by-side layout
- **Mobile**: Swipeable card interface with bottom navigation
- **Breakpoint**: 768px (tablet/desktop switch)

### Data Flow

1. Articles are fetched from Supabase via `/api/news`
2. Data is transformed and cached using React Query
3. Components render articles with proper linking
4. Article pages are server-rendered for SEO

## API Routes

- `GET /api/news` - Fetch all news articles (grouped by category)
- `GET /api/health` - Health check endpoint
- `POST /api/feedback` - Submit feedback (sends email via Nodemailer)

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

```bash
npm run build
npm start
```

Make sure to set all required environment variables in your hosting platform.

## Notes

- **News Ingestion**: Articles are ingested by a separate Python service (see `NewsData/` folder)
- **Database**: This frontend only reads from Supabase, never writes
- **Email**: Feedback form requires Gmail App Password (not regular password)
- **SEO**: Article pages are server-rendered for optimal search engine indexing

## License

© 2025 NewsBlitz. All rights reserved.
