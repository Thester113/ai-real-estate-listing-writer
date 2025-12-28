# Vercel Environment Variables Setup

## ⚠️ CRITICAL: Before You Begin

### 1. Rotate Supabase Service Role Key

The old service role key was hardcoded and exposed in git history. You MUST rotate it:

1. Go to: https://supabase.com/dashboard/project/vhobxnavetcsyzgdnedi/settings/api
2. Click "Reset service role key"
3. Copy the new key
4. Update your `.env.local` file with the new key

### 2. Add Environment Variables to Vercel

Use the Vercel CLI to add environment variables. For each variable, you'll be prompted to select which environments (production, preview, development).

**Recommended:** Add to all three environments (production, preview, development) for consistency.

## Quick Setup Commands

Run these commands in order:

```bash
# 1. Core Application
echo "$NEXT_PUBLIC_APP_URL" | vercel env add NEXT_PUBLIC_APP_URL production preview development
echo "$OPENAI_API_KEY" | vercel env add OPENAI_API_KEY production preview development

# 2. Supabase (USE YOUR NEW ROTATED KEY)
echo "$NEXT_PUBLIC_SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
echo "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development
echo "YOUR_NEW_ROTATED_KEY_HERE" | vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development

# 3. Stripe
echo "$STRIPE_MODE" | vercel env add STRIPE_MODE production preview development
echo "$STRIPE_TEST_SECRET_KEY" | vercel env add STRIPE_TEST_SECRET_KEY production preview development
echo "$NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY" | vercel env add NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY production preview development
echo "$STRIPE_TEST_WEBHOOK_SECRET" | vercel env add STRIPE_TEST_WEBHOOK_SECRET production preview development
echo "$STRIPE_TEST_PRICE_ID_PRO" | vercel env add STRIPE_TEST_PRICE_ID_PRO production preview development

# Stripe Live Keys
echo "$STRIPE_LIVE_SECRET_KEY" | vercel env add STRIPE_LIVE_SECRET_KEY production preview development
echo "$NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY" | vercel env add NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY production preview development
echo "$STRIPE_LIVE_WEBHOOK_SECRET" | vercel env add STRIPE_LIVE_WEBHOOK_SECRET production preview development
echo "$STRIPE_LIVE_PRICE_ID_PRO" | vercel env add STRIPE_LIVE_PRICE_ID_PRO production preview development

# 4. ConvertKit
echo "$CONVERTKIT_API_KEY" | vercel env add CONVERTKIT_API_KEY production preview development
echo "$CONVERTKIT_FORM_ID" | vercel env add CONVERTKIT_FORM_ID production preview development

# 5. CRON_SECRET (Critical for security!)
echo "$CRON_SECRET" | vercel env add CRON_SECRET production preview development

# 6. Gmail SMTP (if configured)
echo "$GMAIL_USER" | vercel env add GMAIL_USER production preview development
echo "$GMAIL_APP_PASSWORD" | vercel env add GMAIL_APP_PASSWORD production preview development

# 7. DEBUG_SECRET (for webhook debugging in production)
openssl rand -base64 32 | vercel env add DEBUG_SECRET production preview development
```

## Alternative: Automated Script

Run the automated setup script:

```bash
bash scripts/setup-vercel-env.sh
```

This script will:
- Verify you've rotated the Supabase key
- Prompt you for the new key
- Add all environment variables to Vercel
- Generate a DEBUG_SECRET automatically

## Verification

After adding variables, verify they're set:

```bash
vercel env ls
```

You should see all the environment variables listed for production, preview, and development.

## Deploy After Setup

Once all environment variables are set:

```bash
# Deploy to production
vercel --prod

# Turn off maintenance mode
vercel env rm MAINTENANCE_MODE production
```

## Current Environment Variable Status

From your `.env.local`:

✅ **Already Configured:**
- NEXT_PUBLIC_APP_URL: `https://aipropertywriter.com`
- OPENAI_API_KEY: Configured
- NEXT_PUBLIC_SUPABASE_URL: Configured
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Configured
- All Stripe keys (test & live): Configured
- ConvertKit: Configured
- CRON_SECRET: Configured

⚠️ **Needs Action:**
- SUPABASE_SERVICE_ROLE_KEY: **MUST BE ROTATED**
- DEBUG_SECRET: Not set (optional, but recommended)
- GMAIL credentials: Not visible in .env.local

⚠️ **Current Status:**
- MAINTENANCE_MODE=1 (Site is in maintenance mode!)

## Important Notes

1. **Never commit `.env.local` or `.env.vercel` to git** - They're already in `.gitignore`
2. **MAINTENANCE_MODE** is currently ON - turn it off after deployment
3. **STRIPE_MODE** is set to "test" - change to "live" when ready for production
4. **Supabase service role key** MUST be rotated before going live
5. **CRON_SECRET** is critical - without it, cron jobs won't work

## Testing

After deployment, test these endpoints:

1. **Health Check:** https://aipropertywriter.com/api/health
2. **Authentication:** Try logging in
3. **Stripe Checkout:** Test payment flow
4. **Cron Job:** Manually trigger `/api/blog/generate` with CRON_SECRET
5. **Contact Form:** Test form submission

## Troubleshooting

If you encounter issues:

1. Check Vercel deployment logs: `vercel logs`
2. Verify all environment variables are set: `vercel env ls`
3. Check the security audit report: `SECURITY_AUDIT_REPORT.md`
4. Review the middleware for rate limiting and CORS settings

---

**Last Updated:** December 25, 2025
**Security Audit:** See `SECURITY_AUDIT_REPORT.md`
