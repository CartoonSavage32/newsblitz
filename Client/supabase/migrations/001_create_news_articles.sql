-- Create news_articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  image_url TEXT,
  source TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  article_url TEXT NOT NULL,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);

-- Create index for date sorting
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at DESC NULLS LAST);

-- Enable Row Level Security (RLS) but allow public read access
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access" ON news_articles
  FOR SELECT
  USING (true);

-- Policy: Allow insert only with service role (for ingestion)
-- Note: In production, you might want to restrict this further
CREATE POLICY "Allow insert for service role" ON news_articles
  FOR INSERT
  WITH CHECK (true);

