-- Migration: Add blog_topics table for automatic weekly blog generation
-- Description: Stores topic pool for random selection without repetition

CREATE TABLE IF NOT EXISTS public.blog_topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  category TEXT NOT NULL,
  author TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient random selection of unused topics
CREATE INDEX idx_blog_topics_unused
  ON public.blog_topics(enabled, last_used_at NULLS FIRST);

-- Index for category-based queries (future analytics)
CREATE INDEX idx_blog_topics_category
  ON public.blog_topics(category);

-- Auto-update timestamp trigger
CREATE TRIGGER update_blog_topics_updated_at
  BEFORE UPDATE ON public.blog_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.blog_topics ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for topic browsing if needed)
CREATE POLICY "Anyone can view enabled blog topics" ON public.blog_topics
  FOR SELECT USING (enabled = true);

-- Only authenticated users can insert/update (admin only)
CREATE POLICY "Authenticated users can manage blog topics" ON public.blog_topics
  FOR ALL USING (auth.role() = 'authenticated');
