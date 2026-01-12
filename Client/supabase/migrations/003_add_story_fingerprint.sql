-- Add story_fingerprint column for deduplication

ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS story_fingerprint TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_story_fingerprint 
ON news_articles(story_fingerprint) 
WHERE story_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_news_articles_fingerprint_lookup 
ON news_articles(story_fingerprint);
