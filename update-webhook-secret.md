# Update Webhook Secret in Vercel

## Method 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project (likely named `passinc` or similar)
3. Go to Settings → Environment Variables
4. Find `STRIPE_TEST_WEBHOOK_SECRET`
5. Click "Edit" or "Delete" then "Add New"
6. Set the value to: `whsec_GGpQqRlkaCRbCTKHiYGCfW8Li3nTQqLj`
7. Make sure it's enabled for Production, Preview, and Development
8. Save the changes

## Method 2: Vercel CLI

If you have Vercel CLI installed and logged in:

```bash
# Remove the old variable
vercel env rm STRIPE_TEST_WEBHOOK_SECRET

# Add the new one
vercel env add STRIPE_TEST_WEBHOOK_SECRET production
# When prompted, enter: whsec_GGpQqRlkaCRbCTKHiYGCfW8Li3nTQqLj

# Also add for preview and development
vercel env add STRIPE_TEST_WEBHOOK_SECRET preview
vercel env add STRIPE_TEST_WEBHOOK_SECRET development
```

## Method 3: Trigger Redeploy

After updating the environment variable, trigger a redeploy:

```bash
# If you have vercel CLI
vercel --prod

# Or just push a small change to trigger auto-deploy
git commit --allow-empty -m "Trigger redeploy for webhook secret update"
git push origin main
```

## Verification

After the environment variable is updated and deployed:

1. Check: https://passinc.vercel.app/api/webhook-debug
2. Look for: `"secretsMatch": true`
3. Test a payment - should get 200 success in Stripe webhook logs

## Current Values

- **Wrong (current):** `whsec_PGUlSWd7dcNptu8wsVqWYLFwTYIiqETA`
- **Correct (needed):** `whsec_GGpQqRlkaCRbCTKHiYGCfW8Li3nTQqLj`