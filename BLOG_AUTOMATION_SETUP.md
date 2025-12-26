# Automatic Weekly Blog Generation - Setup Guide

This guide walks you through setting up automatic weekly blog post generation that runs every Monday at 9 AM UTC.

## Overview

The system:
- Generates 1 SEO-optimized blog post per week
- Selects randomly from a pool of 52 unique topics
- Never repeats until all topics are used (then auto-resets)
- Runs automatically via Vercel Cron

## Setup Steps

### 1. Apply Database Migration

Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/vhobxnavetcsyzgdnedi/sql) and run:

```sql
-- Migration: Add blog_topics table for automatic weekly blog generation
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
CREATE INDEX IF NOT EXISTS idx_blog_topics_unused
  ON public.blog_topics(enabled, last_used_at NULLS FIRST);

-- Index for category-based queries
CREATE INDEX IF NOT EXISTS idx_blog_topics_category
  ON public.blog_topics(category);

-- Row Level Security
ALTER TABLE public.blog_topics ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Anyone can view enabled blog topics" ON public.blog_topics;
CREATE POLICY "Anyone can view enabled blog topics" ON public.blog_topics
  FOR SELECT USING (enabled = true);

-- Allow service role full access
DROP POLICY IF EXISTS "Service role can manage blog topics" ON public.blog_topics;
CREATE POLICY "Service role can manage blog topics" ON public.blog_topics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

**Verify**: You should see `blog_topics` in your Tables list.

### 2. Seed Blog Topics

Run the seeding script to populate 52 diverse topics:

```bash
npx tsx scripts/seed-blog-topics.ts
```

**Expected Output**:
```
🌱 Blog Topics Seeding Script
📊 Topic Statistics:
   Total topics: 52
   Category breakdown:
     - Tips & Strategies: 15 topics
     - Industry Insights: 12 topics
     - Writing Tips: 10 topics
     - SEO & Marketing: 8 topics
     - Psychology: 4 topics
     - Best Practices: 3 topics
✓ [52/52] Successfully inserted
🎉 All topics seeded successfully!
```

### 3. Add CRON_SECRET to Vercel

The cron endpoint requires authentication to prevent unauthorized access.

```bash
# Add to production environment
vercel env add CRON_SECRET production

# When prompted, paste this value:
YJXqNHP0kashHKrDdL+H84b4HOzOWMfAFQ6c2gM1C9U=
```

Or add it via the [Vercel Dashboard](https://vercel.com/tomhesters-projects/aipropertywriter/settings/environment-variables):
- Key: `CRON_SECRET`
- Value: `YJXqNHP0kashHKrDdL+H84b4HOzOWMfAFQ6c2gM1C9U=`
- Environment: Production

### 4. Deploy to Vercel

```bash
git add .
git commit -m "Add automatic weekly blog generation system"
git push origin main
```

Vercel will automatically deploy the changes.

### 5. Verify Cron Configuration

Check your [Vercel Cron Dashboard](https://vercel.com/tomhesters-projects/aipropertywriter/settings/cron) to confirm:

- Cron job is enabled
- Schedule: `0 9 * * 1` (Monday 9 AM UTC)
- Target: `/api/blog/generate`

### 6. Test the Endpoint (Optional)

You can manually trigger the cron to test:

```bash
# Using curl
curl -X POST https://www.aipropertywriter.com/api/blog/generate \
  -H "Authorization: Bearer YJXqNHP0kashHKrDdL+H84b4HOzOWMfAFQ6c2gM1C9U="

# Or via Vercel CLI
vercel cron trigger /api/blog/generate
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "topic": {
      "id": "...",
      "title": "5 Essential Elements of High-Converting Real Estate Listings",
      "category": "Tips & Strategies",
      "author": "Sarah Johnson"
    },
    "post": {
      "id": "...",
      "title": "...",
      "slug": "...",
      "url": "https://www.aipropertywriter.com/blog/..."
    }
  }
}
```

## How It Works

### Weekly Cycle

```
Monday 9 AM UTC
    ↓
Vercel Cron triggers
    ↓
/api/blog/generate endpoint
    ↓
Select random unused topic
    ↓
Generate blog post via OpenAI
    ↓
Save to database
    ↓
Mark topic as used
    ↓
Done! (Post visible at /blog)
```

### Topic Selection Algorithm

```typescript
1. Query: SELECT * FROM blog_topics
   WHERE enabled = true AND last_used_at IS NULL

2. If no results → Reset all topics (new cycle)
   UPDATE blog_topics SET last_used_at = NULL

3. Pick random topic from pool

4. Generate blog post

5. Mark as used
   UPDATE blog_topics
   SET last_used_at = NOW(), usage_count = usage_count + 1
```

## Monitoring

### Check Logs

```bash
# Watch deployment logs
vercel logs --follow

# Check specific cron execution
vercel logs --since=1h | grep CRON
```

### Check Generated Posts

Visit your blog: https://www.aipropertywriter.com/blog

### Vercel Dashboard

Monitor cron execution history:
- [Cron Dashboard](https://vercel.com/tomhesters-projects/aipropertywriter/settings/cron)
- Shows last execution time
- Success/failure status
- Error logs

## Troubleshooting

### "No topics available for generation"

**Cause**: All 52 topics have been used.

**Solution**: The system auto-resets. If it persists:
```sql
-- Manually reset all topics
UPDATE blog_topics SET last_used_at = NULL;
```

### "Unauthorized" Error

**Cause**: CRON_SECRET not set or mismatch.

**Solution**: Verify CRON_SECRET in Vercel environment variables matches `.env.local`

### Cron Not Running

**Check**:
1. Vercel Cron enabled in dashboard
2. CRON_SECRET added to production environment
3. Deployment successful
4. Check logs: `vercel logs --since=24h`

### Blog Generation Failed

**Check**:
1. OpenAI API key valid
2. Supabase database accessible
3. Check error in logs: `vercel logs --since=1h | grep ERROR`

If generation fails, the topic is NOT marked as used and will retry next week.

## Cost Estimate

- **Per post**: ~$0.20 (OpenAI GPT-4o for 1500-2000 words)
- **Per week**: $0.20
- **Per month**: ~$0.80
- **Per year**: ~$10.40

**Time saved**: ~2 hours/week × 52 weeks = 104 hours/year

## What's Next?

### Week 1
- ✓ First post auto-generated on Monday 9 AM UTC
- ✓ Check https://www.aipropertywriter.com/blog

### Month 1
- ✓ 4-5 posts published automatically
- ✓ All different topics (no repeats)
- ✓ Monitor SEO traffic in Google Analytics

### Year 1
- ✓ 52 unique posts (full topic cycle)
- ✓ Measure organic traffic growth
- ✓ System auto-resets and continues

## Files Reference

**New Files Created**:
```
lib/blog-topics.ts              # Topic selection logic
lib/blog-topics-seed.ts         # 52 topic definitions
app/api/blog/generate/route.ts  # Cron endpoint
scripts/seed-blog-topics.ts     # One-time seeding script
supabase/migrations/001_*.sql   # Database migration
```

**Environment Variables**:
```
CRON_SECRET=YJXqNHP0kashHKrDdL+H84b4HOzOWMfAFQ6c2gM1C9U=
```

## Support

If you encounter issues:
1. Check Vercel logs: `vercel logs --follow`
2. Check Supabase logs in dashboard
3. Verify all environment variables are set
4. Test endpoint manually with curl command above

---

**Last Updated**: 2025-12-25
**Status**: Ready for deployment
