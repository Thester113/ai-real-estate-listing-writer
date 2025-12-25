# Supabase Database Setup

To fix the dashboard errors, you need to set up the database schema in Supabase.

## Step 1: Access Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `vhobxnavetcsyzgdnedi`
3. Click on "SQL Editor" in the left sidebar

## Step 2: Run Schema Creation

Copy and paste this SQL into the SQL Editor and run it:

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro')),
  subscription_status TEXT DEFAULT 'active',
  subscription_id TEXT,
  customer_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create usage table
CREATE TABLE public.usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listings_generated INTEGER DEFAULT 0,
  words_generated INTEGER DEFAULT 0,
  reset_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Create generations table
CREATE TABLE public.generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  result JSONB NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  published BOOLEAN DEFAULT false,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create email_subscribers table
CREATE TABLE public.email_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create webhook_events table
CREATE TABLE public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
```

## Step 3: Run RLS Policies

After creating tables, run the policies:

```sql
-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Usage policies
CREATE POLICY "Users can view own usage" ON public.usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Generations policies
CREATE POLICY "Users can view own generations" ON public.generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations" ON public.generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Blog posts policies (public read, admin write)
CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
  FOR SELECT USING (published = true);

-- Email subscribers policies (insert only for new subscriptions)
CREATE POLICY "Anyone can subscribe to emails" ON public.email_subscribers
  FOR INSERT WITH CHECK (true);

-- Webhook events policies (service role only)
CREATE POLICY "Service role can manage webhook events" ON public.webhook_events
  FOR ALL USING (auth.role() = 'service_role');
```

## Step 4: Create Functions

Run these functions for usage tracking:

```sql
-- Create usage tracking functions
CREATE OR REPLACE FUNCTION public.get_or_create_usage(user_uuid UUID)
RETURNS TABLE(
  listings_generated INTEGER,
  words_generated INTEGER,
  reset_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month DATE;
  usage_record RECORD;
BEGIN
  current_month := DATE_TRUNC('month', NOW());
  
  -- Try to get existing usage for current month
  SELECT * INTO usage_record
  FROM public.usage 
  WHERE user_id = user_uuid 
    AND DATE_TRUNC('month', reset_date) = current_month;
  
  -- If no record exists, create one
  IF usage_record IS NULL THEN
    INSERT INTO public.usage (user_id, listings_generated, words_generated, reset_date)
    VALUES (user_uuid, 0, 0, current_month + INTERVAL '1 month')
    RETURNING * INTO usage_record;
  END IF;
  
  RETURN QUERY SELECT 
    usage_record.listings_generated,
    usage_record.words_generated,
    usage_record.reset_date;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_usage(
  user_uuid UUID,
  listings_delta INTEGER DEFAULT 0,
  words_delta INTEGER DEFAULT 0
)
RETURNS TABLE(
  listings_generated INTEGER,
  words_generated INTEGER,
  reset_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month DATE;
  usage_record RECORD;
BEGIN
  current_month := DATE_TRUNC('month', NOW());
  
  -- Update or insert usage
  INSERT INTO public.usage (user_id, listings_generated, words_generated, reset_date)
  VALUES (user_uuid, listings_delta, words_delta, current_month + INTERVAL '1 month')
  ON CONFLICT (user_id) 
  DO UPDATE SET
    listings_generated = usage.listings_generated + listings_delta,
    words_generated = usage.words_generated + words_delta,
    updated_at = NOW()
  RETURNING * INTO usage_record;
  
  RETURN QUERY SELECT 
    usage_record.listings_generated,
    usage_record.words_generated,
    usage_record.reset_date;
END;
$$;
```

## Step 5: Create Trigger for Auto Profile Creation

```sql
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
```

After running all these SQL commands, your dashboard should work properly!