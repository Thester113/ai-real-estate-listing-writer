# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Property Writer is a Next.js 14 SaaS application for real estate agents to generate property listings, marketing copy, and email content using OpenAI's GPT models. The app uses a Stripe subscription model (Starter/Pro tiers) with usage limits enforced through Supabase.

**Tech Stack:**
- **Framework:** Next.js 14 (App Router)
- **Database/Auth:** Supabase (PostgreSQL + Auth)
- **Payments:** Stripe (with test/live mode switching)
- **AI:** OpenAI GPT-4
- **Email Marketing:** ConvertKit integration
- **Deployment:** Vercel
- **Styling:** Tailwind CSS + Radix UI

## Development Commands

```bash
# Development
npm run dev                    # Start dev server on port 3000
npm run build                  # Build for production
npm run typecheck              # Run TypeScript type checking
npm run lint                   # Run ESLint with auto-fix
npm run lint:check             # Lint without fixing

# Testing
npm run test                   # Run tests with Vitest
npm run test:watch             # Run tests in watch mode
npm run test:coverage          # Run tests with coverage report
npm run smoke                  # Run smoke tests against deployed app

# Database
npm run migrate                # Push schema to Supabase (npx supabase db push)
npm run seed                   # Seed database with sample data

# Setup & Deployment
npm run bootstrap              # Interactive setup script
npm run stripe:setup           # Create Stripe products and prices
npm run sitemap                # Generate sitemap.xml (runs on postbuild)
npm run deploy                 # Deploy to Vercel production

# Makefile shortcuts (optional)
make dev                       # npm run dev
make test                      # Run all tests
make check                     # typecheck + lint + test
make migrate                   # Push database schema
```

## Architecture & Key Patterns

### Environment Configuration

The app uses a sophisticated environment configuration system:

1. **Stripe Mode Switching:** The `lib/stripe-config.ts` module provides test/live mode switching controlled by `STRIPE_MODE` env var. Use `getStripeConfig()` to get the appropriate keys.

2. **Supabase Client:** Two clients are exported from `lib/supabase-client.ts`:
   - `supabase` - Anonymous/authenticated client for client-side use
   - `supabaseAdmin` - Service role client for admin operations (bypasses RLS)

3. **Environment Variables:** See `.env.example` for all required/optional vars. The bootstrap script helps set these up interactively.

### Database Schema (supabase/schema.sql)

Key tables:
- `profiles` - User profiles (extends auth.users) with plan type, subscription status, and Stripe customer_id
- `usage` - Monthly usage tracking (listings_generated, words_generated) with unique constraint on (user_id, month)
- `generations` - Historical record of all generated listings
- `blog_posts` - SEO blog content with published/draft states
- `email_subscribers` - Newsletter subscribers
- `webhook_events` - Idempotency tracking for Stripe webhooks

**Important Functions:**
- `get_or_create_usage(user_uuid)` - Gets or creates current month's usage record
- `increment_usage(user_uuid, listings_delta, words_delta)` - Atomically increments usage

### API Routes Structure

```
app/api/
├── generate/listing/      # Main AI listing generation (30s timeout)
├── stripe/
│   ├── create-checkout/   # Create Stripe checkout session
│   ├── create-portal/     # Stripe customer portal link
│   └── webhook/           # Stripe event handler (10s timeout)
├── blog/generate/         # Automated blog post generation (30s timeout, cron)
├── newsletter/subscribe/  # Newsletter signup
├── contact/               # Contact form submission
├── admin/                 # Admin-only routes (maintenance, blog management)
└── health/                # Health check endpoint
```

### Middleware & Security

The `middleware.ts` file provides:
- **Rate Limiting:** In-memory rate limiting per IP+path (15min windows). Production should use Redis.
- **Maintenance Mode:** When `MAINTENANCE_MODE=1`, redirects all traffic to `/maintenance` page
- **Security Headers:** CSP, X-Frame-Options, etc. via `lib/security.ts`
- **CORS:** Configured for API routes
- **Auth Redirects:** `/login`, `/signup`, `/register` → `/auth`

### Subscription & Usage Limits

Plan limits are defined in `app/api/generate/listing/route.ts`:
- **Starter:** 10 listings/month
- **Pro:** Unlimited listings

Usage is tracked through the `increment_usage()` function and checked before generation.

### Stripe Webhook Handling

The webhook handler (`app/api/stripe/webhook/route.ts`) processes:
- `checkout.session.completed` - Create/update profile with subscription
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Cancel subscription

**Critical:** Uses `webhook_events` table for idempotency to prevent duplicate processing.

### Blog System

The app has an automated SEO blog system:
- Topics defined in `lib/blog-topics.ts` and seeded into `blog_posts` table
- Cron job runs weekly (Monday 9am) to generate one post via `/api/blog/generate`
- Posts are marked as published and displayed at `/blog/[slug]`
- RSS feed generated at `/rss.xml`

### Path Aliases (tsconfig.json)

```typescript
@/*           →  ./*
@/components/* → ./components/*
@/lib/*       →  ./lib/*
@/utils/*     →  ./utils/*
@/types/*     →  ./types/*
@/hooks/*     →  ./hooks/*
```

### Image Domains

Configured in `next.config.js`:
- images.unsplash.com
- via.placeholder.com

### Vercel Configuration

See `vercel.json`:
- Function timeouts: 30s for AI generation, 60s for blog generation
- Cron jobs: Weekly blog generation (Mon 9am), Weekly digest (Fri 3pm)
- Security headers applied to all API routes

## Deployment Workflow (IMPORTANT)

**Always deploy through GitHub - never use `vercel` CLI directly.**

### Required Steps Before Pushing

1. **Run tests**: `npm run test`
2. **Run typecheck**: `npm run typecheck`
3. **Run lint**: `npm run lint:check`
4. **Build locally**: `npm run build`

### Deployment Process

```bash
# After all tests pass:
git add .
git commit -m "Description of changes"
git push origin main
```

Vercel automatically deploys when changes are pushed to GitHub:
- Push to `main` → Production deployment (www.aipropertywriter.com)
- Push to other branches → Preview deployment

### Why GitHub, Not Vercel CLI

- GitHub is the source of truth for all code
- Enables code review via pull requests
- Maintains deployment history and rollback capability
- Ensures CI/CD pipeline consistency

**Do NOT use `vercel --prod` or `npm run deploy` directly.**

## Important Notes

### When Working with Stripe

- **Always use `getStripeConfig()`** from `lib/stripe-config.ts` to get keys - never hardcode or use env vars directly
- Test mode uses `STRIPE_TEST_*` keys, live mode uses `STRIPE_LIVE_*` keys
- Toggle mode with `STRIPE_MODE=live` or `STRIPE_MODE=test`
- Webhook secret is also mode-dependent

### When Working with Supabase

- Use `supabaseAdmin` for server-side operations that need to bypass RLS
- Use `supabase` for client-side operations
- Profile creation is automatic on first auth (handled in `getProfile()`)
- Usage is automatically created per month when accessed

### When Adding New API Routes

1. Add route to `middleware.ts` rate limit config if needed
2. Set appropriate timeout in `vercel.json` if > 10s
3. Use `supabaseAdmin` for database operations
4. Return proper error responses with security headers

### When Modifying Database Schema

1. Update `supabase/schema.sql`
2. Run `npm run migrate` (or `npx supabase db push`)
3. Update TypeScript types in `types/supabase.ts` if needed
4. Consider creating a migration file in `supabase/migrations/` for production

### Email Integrations

- **ConvertKit:** Newsletter signups and email sequences (see `lib/convertkit.ts`)
- **Gmail SMTP:** Contact form notifications via Nodemailer (see `app/api/contact/route.ts`)
- Email templates are in `email-templates/` directory

### Analytics & Monitoring

- **PostHog:** Product analytics via `components/analytics.tsx`
- **Sentry:** Error tracking configured in `next.config.js` and `lib/sentry.ts`
- Both are optional (check for env vars before initializing)

## Bootstrap & Setup

For first-time setup or fresh deployments:

```bash
npm run bootstrap
# Or non-interactive:
npm run bootstrap -- --noninteractive --openai-key=... --supabase-url=... [etc]
```

This script:
1. Validates CLI tools (node, vercel, supabase, stripe, jq)
2. Creates `.env.local` from user inputs or args
3. Links Vercel project and sets environment variables
4. Pushes database schema to Supabase
5. Creates Stripe products and prices
6. Optionally deploys to production

## Testing

- Unit/integration tests use Vitest
- Smoke tests in `scripts/smoke.mjs` verify deployed app endpoints
- Run type checking before committing: `npm run typecheck`

## Common Tasks

**Add a new subscription plan:**
1. Update `plan_type` enum in `supabase/schema.sql`
2. Add limits to `app/api/generate/listing/route.ts`
3. Run `npm run migrate`
4. Create price in Stripe via `scripts/stripe-setup.js`

**Generate blog posts manually:**
```bash
tsx scripts/generate-blog-posts.ts
```

**Test Stripe webhooks locally:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Check maintenance mode:**
Set `MAINTENANCE_MODE=1` in env vars to redirect all traffic to `/maintenance` page.
