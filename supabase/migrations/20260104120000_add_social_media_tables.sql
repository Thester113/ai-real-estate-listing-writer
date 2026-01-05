-- Social media OAuth credentials storage
CREATE TABLE IF NOT EXISTS public.social_credentials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'facebook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  account_id TEXT,  -- Platform-specific account/page ID
  account_name TEXT,  -- Display name for admin reference
  metadata JSONB DEFAULT '{}',  -- Additional platform-specific data (e.g., page_access_token for FB)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(platform)  -- One account per platform
);

-- Social media post tracking
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'facebook')),
  platform_post_id TEXT,  -- ID returned by the platform after posting
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'skipped')),
  post_content TEXT,  -- The actual content that was posted
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_credentials_platform ON public.social_credentials(platform);
CREATE INDEX IF NOT EXISTS idx_social_credentials_active ON public.social_credentials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_social_posts_blog ON public.social_posts(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON public.social_posts(status, platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON public.social_posts(created_at DESC);

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_social_credentials_updated_at BEFORE UPDATE ON public.social_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (no public access - admin only via supabaseAdmin)
ALTER TABLE public.social_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- No RLS policies = no public access, only service role can access
