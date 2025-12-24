# Deployment Guide - AI Real Estate Listing Writer

This guide provides complete instructions for deploying your AI Real Estate Listing Writer application to production.

## Quick Start

For immediate deployment, run:

```bash
npm install
cp .env.example .env.local
# Fill in your API keys in .env.local
npm run bootstrap
```

The bootstrap script will handle Stripe setup, Vercel deployment, environment configuration, and database migration automatically.

## Prerequisites

### Required Accounts
1. **OpenAI** - For AI-powered listing generation
2. **Supabase** - Database and authentication
3. **Stripe** - Payment processing
4. **Vercel** - Hosting and deployment
5. **ConvertKit** - Email marketing (required)

### Optional Accounts
- **PostHog** - Product analytics
- **Sentry** - Error tracking and performance monitoring

### Required CLI Tools

Install these tools before running the bootstrap script:

```bash
# Install Node.js dependencies
npm install -g vercel@latest
npm install -g supabase@latest

# macOS
brew install stripe/stripe-cli/stripe jq

# Linux
# Install Stripe CLI from https://stripe.com/docs/stripe-cli
sudo apt-get install jq

# Verify installation
node --version    # Should be 18+
npm --version
vercel --version
supabase --version
stripe --version
jq --version
```

## Environment Variables

### Required Variables

Copy `.env.example` to `.env.local` and fill in these required values:

| Variable | Source | Description |
|----------|--------|-------------|
| `OPENAI_API_KEY` | OpenAI Dashboard | Your OpenAI API key for GPT-4 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings | Your project's API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings | Service role secret key |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | Secret key (starts with `sk_`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard | Publishable key (starts with `pk_`) |
| `CONVERTKIT_API_KEY` | ConvertKit Account | API key for email marketing |
| `CONVERTKIT_FORM_ID` | ConvertKit Forms | Form ID for newsletter signups |

### Auto-Generated Variables

These are set automatically by the bootstrap script:

- `STRIPE_PRICE_ID_STARTER` - Starter plan price ID
- `STRIPE_PRICE_ID_PRO` - Pro plan price ID  
- `VERCEL_PROJECT_ID` - Vercel project identifier
- `VERCEL_ORG_ID` - Vercel organization ID
- `NEXT_PUBLIC_APP_URL` - Your deployed app URL

### Optional Analytics

Add these for enhanced monitoring:

```bash
POSTHOG_KEY=phc_...              # PostHog project API key
POSTHOG_HOST=https://us.posthog.com
SENTRY_DSN=https://...@sentry.io/...
```

## Bootstrap Script Details

The `scripts/bootstrap.sh` script performs these operations:

### 1. CLI Validation
- Checks for required tools: node, npm, vercel, supabase, stripe, jq
- Exits with helpful install instructions if any are missing

### 2. Environment Setup
- Creates `.env.local` from `.env.example` if it doesn't exist
- Prompts for all required API keys and secrets
- Supports non-interactive mode with command-line arguments:

```bash
./scripts/bootstrap.sh --noninteractive \
  --openai-key=sk-... \
  --supabase-url=https://... \
  --stripe-secret=sk_...
```

### 3. Database Migration
- Runs `supabase db push` to apply schema and policies
- Creates all necessary tables with Row Level Security
- Sets up triggers for automatic timestamp updates

### 4. Stripe Product Setup
- Creates "AI Real Estate Listing Writer" product if it doesn't exist
- Sets up two pricing tiers:
  - **Starter**: $19/month (price_...)
  - **Pro**: $39/month (price_...)
- Updates `.env.local` with generated price IDs

### 5. Vercel Project Setup
- Links to existing project or creates new one
- Uploads all environment variables to production, preview, and development
- Retrieves project metadata for CI/CD

### 6. Production Deployment
- Runs `vercel --prod` to deploy your application
- Updates `NEXT_PUBLIC_APP_URL` with the deployed domain
- Uploads the updated URL to Vercel environment

## Manual Configuration Required

### Stripe Webhook Setup

**This is the only manual step required.**

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set the URL to: `https://YOUR_DOMAIN/api/stripe/webhook`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the webhook signing secret
7. Add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

```bash
# Add to .env.local
STRIPE_WEBHOOK_SECRET=whsec_...

# Upload to Vercel
echo "whsec_..." | vercel env add STRIPE_WEBHOOK_SECRET production
```

## CI/CD Setup

### GitHub Secrets

Add these secrets to your GitHub repository:

| Secret | Value | Source |
|--------|--------|--------|
| `VERCEL_TOKEN` | Your Vercel token | [Vercel Account Settings](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | From `.env.local` | Auto-generated by bootstrap |
| `VERCEL_PROJECT_ID` | From `.env.local` | Auto-generated by bootstrap |

### Optional Sentry Integration

For source map uploads:

| Secret | Value |
|--------|--------|
| `SENTRY_AUTH_TOKEN` | Sentry auth token |
| `SENTRY_ORG` | Your organization slug |
| `SENTRY_PROJECT` | Your project slug |

### Workflow Triggers

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on:
- Push to `main` branch
- Manual dispatch via GitHub UI

## Database Management

### Schema Updates

```bash
# Local development
npm run migrate

# Production (handled by CI/CD)
# Schema changes are applied automatically on deployment
```

### Seeding Data

```bash
# Add sample data for testing
npm run seed
```

### Database Access

```bash
# Connect to remote database
supabase db pull

# View database in Supabase dashboard
# https://app.supabase.com/project/YOUR_PROJECT_ID
```

## Monitoring & Debugging

### Production Logs

```bash
# View real-time logs
npm run logs
# or
vercel logs --prod

# View function logs
vercel logs --prod --since=1h
```

### Health Checks

```bash
# Run smoke tests against production
npm run smoke

# Check specific endpoint
curl https://your-domain.vercel.app/api/health
```

### Analytics

- **PostHog**: Track user behavior and feature usage
- **Sentry**: Monitor errors and performance issues
- **Vercel Analytics**: Built-in web vitals monitoring

## Cost Management

### Free Tier Limits

- **Vercel**: 100GB bandwidth/month
- **Supabase**: 50,000 monthly active users
- **OpenAI**: Pay per usage (set limits in dashboard)
- **Stripe**: 2.9% + 30¢ per transaction
- **ConvertKit**: 1,000 subscribers free

### Usage Caps

The application includes built-in rate limiting:

- **Starter Plan**: 10 listings/day, 100/month
- **Pro Plan**: 50 listings/day, 500/month
- **Token Limits**: 2,000 (Starter) / 5,000 (Pro) tokens per request

Set OpenAI usage limits in your [OpenAI Dashboard](https://platform.openai.com/account/billing/limits).

## Rollback Procedures

### Quick Rollback

```bash
# Rollback to previous deployment
vercel rollback

# Rollback specific deployment
vercel rollback [deployment-url]
```

### Database Rollback

```bash
# Reset to previous migration
supabase db reset --linked

# Manual SQL rollback
psql $DATABASE_URL -c "DROP TABLE IF EXISTS ..."
```

### Git Rollback

```bash
# Revert last commit
git revert HEAD

# Revert to specific commit
git revert [commit-hash]

# Force push to trigger redeployment
git push origin main
```

## Security Checklist

- [ ] Stripe webhook secret configured
- [ ] Supabase RLS policies enabled
- [ ] Environment variables use Vercel's encrypted storage
- [ ] API rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] CORS headers properly configured
- [ ] Security headers (CSP, HSTS) enabled
- [ ] Sensitive data not logged

## Troubleshooting

### Common Issues

**Bootstrap fails with "Missing CLI"**
```bash
# Install missing tools
npm install -g vercel supabase
brew install stripe/stripe-cli/stripe
```

**Vercel deployment fails**
```bash
# Check environment variables
vercel env ls

# Clear build cache
vercel --force

# Check build logs
vercel logs --prod
```

**Database connection fails**
```bash
# Verify Supabase connection
supabase status

# Test connection
psql $SUPABASE_DB_URL -c "SELECT NOW()"
```

**Stripe webhook not working**
```bash
# Test webhook locally
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Verify signature
echo $STRIPE_WEBHOOK_SECRET
```

### Support

For deployment issues:
1. Check the logs: `vercel logs --prod`
2. Run smoke tests: `npm run smoke`
3. Verify environment variables: `make env-check`
4. Review this documentation

## Success Verification

### Deployed If Checklist

Verify your deployment is working by checking:

- [ ] Homepage loads: `curl https://your-domain.com`
- [ ] Health check passes: `curl https://your-domain.com/api/health`
- [ ] User registration works
- [ ] Stripe checkout can be initiated
- [ ] AI listing generation works (with valid subscription)
- [ ] Blog pages load
- [ ] Webhook receives Stripe events
- [ ] Email capture works
- [ ] Analytics track events (if configured)
- [ ] Cron jobs are scheduled in Vercel dashboard

### Test Payment Flow

1. Go to your deployed site
2. Sign up for an account
3. Navigate to subscription page
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete subscription
6. Generate a test listing
7. Verify usage tracking in dashboard

Your AI Real Estate Listing Writer is now fully deployed and ready for production use!