-- Migration: Fix RLS Policies
-- Fixes 4 security issues identified in RLS audit

-- ==============================================================================
-- CRITICAL: Enable RLS on market_analysis_cache (was completely unprotected)
-- ==============================================================================
ALTER TABLE public.market_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached market data (public data)
CREATE POLICY "Allow public read of market cache" ON public.market_analysis_cache
  FOR SELECT USING (true);

-- Only service role can write/update/delete market cache
CREATE POLICY "Service role manages market cache" ON public.market_analysis_cache
  FOR ALL USING (auth.role() = 'service_role');

-- ==============================================================================
-- HIGH: Fix blog_topics policy (was allowing any authenticated user to manage)
-- ==============================================================================
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can manage topics" ON public.blog_topics;

-- Create restrictive policy for service role only
CREATE POLICY "Service role manages blog topics" ON public.blog_topics
  FOR ALL USING (auth.role() = 'service_role');

-- ==============================================================================
-- HIGH: Add explicit write policy for blog_posts
-- ==============================================================================
-- Add service role write policy for blog posts management
CREATE POLICY "Service role manages blog posts" ON public.blog_posts
  FOR ALL USING (auth.role() = 'service_role');

-- ==============================================================================
-- MEDIUM: Add DELETE policy for generations (users can delete their own history)
-- ==============================================================================
CREATE POLICY "Users can delete own generations" ON public.generations
  FOR DELETE USING (auth.uid() = user_id);
