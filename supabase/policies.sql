-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redfin_market_data ENABLE ROW LEVEL SECURITY;

-- Profiles policies (optimized with select wrapper)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- Usage policies (optimized with select wrapper)
CREATE POLICY "Users can view own usage" ON public.usage
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own usage" ON public.usage
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own usage" ON public.usage
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- Generations policies (optimized with select wrapper)
CREATE POLICY "Users can view own generations" ON public.generations
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own generations" ON public.generations
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own generations" ON public.generations
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Blog posts policies (public read, service role write)
CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
  FOR SELECT USING (published = true);

CREATE POLICY "Service role manages blog posts" ON public.blog_posts
  FOR ALL USING ((select auth.role()) = 'service_role');

-- Blog topics policies (separate policies to avoid overlap)
CREATE POLICY "Anyone can view enabled blog topics" ON public.blog_topics
  FOR SELECT USING (enabled = true);

CREATE POLICY "Service role can manage blog topics" ON public.blog_topics
  FOR INSERT WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Service role can update blog topics" ON public.blog_topics
  FOR UPDATE USING ((select auth.role()) = 'service_role');

CREATE POLICY "Service role can delete blog topics" ON public.blog_topics
  FOR DELETE USING ((select auth.role()) = 'service_role');

-- Market analysis cache policies (public read, service role write - separate to avoid overlap)
CREATE POLICY "Allow public read of market cache" ON public.market_analysis_cache
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert market cache" ON public.market_analysis_cache
  FOR INSERT WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Service role can update market cache" ON public.market_analysis_cache
  FOR UPDATE USING ((select auth.role()) = 'service_role');

CREATE POLICY "Service role can delete market cache" ON public.market_analysis_cache
  FOR DELETE USING ((select auth.role()) = 'service_role');

-- Redfin market data policies (public read only)
CREATE POLICY "Allow public read" ON public.redfin_market_data
  FOR SELECT USING (true);

-- Email subscribers policies (insert only for new subscriptions)
CREATE POLICY "Anyone can subscribe to emails" ON public.email_subscribers
  FOR INSERT WITH CHECK (true);

-- Webhook events policies (service role only, optimized)
CREATE POLICY "Service role can manage webhook events" ON public.webhook_events
  FOR ALL USING ((select auth.role()) = 'service_role');

-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();