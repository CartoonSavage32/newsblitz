-- Add timestamp fields for article lifecycle management
-- Lifecycle stages:
-- ACTIVE: 0-48 hours (now < expired_at) - HTTP 200, in sitemap
-- EXPIRED: 48 hours - 7 days (expired_at <= now < gone_at) - HTTP 200, archived UI
-- GONE: 7-30 days (gone_at <= now < deleted_at) - HTTP 410, noindex
-- DELETED: 30+ days (now >= deleted_at) - physically deleted

ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS gone_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Keep expired boolean for backward compatibility (computed from expired_at)
ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS expired BOOLEAN DEFAULT FALSE;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_news_articles_expired_at ON news_articles(expired_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_gone_at ON news_articles(gone_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_deleted_at ON news_articles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_expired ON news_articles(expired) WHERE expired = FALSE;

-- Calculate timestamps for existing articles based on published_at or created_at
-- expired_at = published_at/created_at + 48 hours
-- gone_at = published_at/created_at + 7 days
-- deleted_at = published_at/created_at + 30 days
UPDATE news_articles 
SET 
  expired_at = COALESCE(published_at, created_at) + INTERVAL '48 hours',
  gone_at = COALESCE(published_at, created_at) + INTERVAL '7 days',
  deleted_at = COALESCE(published_at, created_at) + INTERVAL '30 days',
  expired = CASE 
    WHEN COALESCE(published_at, created_at) + INTERVAL '48 hours' <= NOW() THEN TRUE 
    ELSE FALSE 
  END
WHERE expired_at IS NULL;
