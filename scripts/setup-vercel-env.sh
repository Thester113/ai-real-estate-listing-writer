#!/bin/bash

# Script to add all environment variables to Vercel
# Run this script after rotating the Supabase service role key

set -e

echo "📝 Setting up Vercel environment variables..."
echo ""
echo "⚠️  IMPORTANT: Make sure you have rotated the Supabase service role key first!"
echo ""
read -p "Have you rotated the Supabase service role key? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Please rotate the Supabase service role key before proceeding."
    echo "   Go to: https://supabase.com/dashboard/project/vhobxnavetcsyzgdnedi/settings/api"
    exit 1
fi

echo ""
read -p "Enter the NEW Supabase service role key: " NEW_SUPABASE_KEY
echo ""

# Load environment variables from .env.local
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

source .env.local

echo "🔧 Adding environment variables to Vercel..."
echo ""

# Function to add environment variable to all environments
add_env() {
    local key=$1
    local value=$2
    local scope="${3:-production,preview,development}"

    echo "Adding $key..."
    echo "$value" | vercel env add "$key" "$scope" --force 2>/dev/null || true
}

# Core Application
add_env "NEXT_PUBLIC_APP_URL" "$NEXT_PUBLIC_APP_URL"
add_env "OPENAI_API_KEY" "$OPENAI_API_KEY"

# Supabase - Use NEW service role key
add_env "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
add_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
add_env "SUPABASE_SERVICE_ROLE_KEY" "$NEW_SUPABASE_KEY"

# Stripe Configuration
add_env "STRIPE_MODE" "$STRIPE_MODE"

# Stripe Test Keys
add_env "STRIPE_TEST_SECRET_KEY" "$STRIPE_TEST_SECRET_KEY"
add_env "NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY"
add_env "STRIPE_TEST_WEBHOOK_SECRET" "$STRIPE_TEST_WEBHOOK_SECRET"
add_env "STRIPE_TEST_PRICE_ID_PRO" "$STRIPE_TEST_PRICE_ID_PRO"

# Stripe Live Keys
add_env "STRIPE_LIVE_SECRET_KEY" "$STRIPE_LIVE_SECRET_KEY"
add_env "NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY"
add_env "STRIPE_LIVE_WEBHOOK_SECRET" "$STRIPE_LIVE_WEBHOOK_SECRET"
add_env "STRIPE_LIVE_PRICE_ID_PRO" "$STRIPE_LIVE_PRICE_ID_PRO"

# ConvertKit
add_env "CONVERTKIT_API_KEY" "$CONVERTKIT_API_KEY"
add_env "CONVERTKIT_FORM_ID" "$CONVERTKIT_FORM_ID"

# Cron Secret
add_env "CRON_SECRET" "$CRON_SECRET"

# Gmail (if configured)
if [ ! -z "$GMAIL_USER" ]; then
    add_env "GMAIL_USER" "$GMAIL_USER"
fi

if [ ! -z "$GMAIL_APP_PASSWORD" ]; then
    add_env "GMAIL_APP_PASSWORD" "$GMAIL_APP_PASSWORD"
fi

# Optional - Analytics (if configured)
if [ ! -z "$POSTHOG_KEY" ] && [ "$POSTHOG_KEY" != "phc_..." ]; then
    add_env "POSTHOG_KEY" "$POSTHOG_KEY"
    add_env "POSTHOG_HOST" "$POSTHOG_HOST"
fi

if [ ! -z "$SENTRY_DSN" ] && [ "$SENTRY_DSN" != "https://...@sentry.io/..." ]; then
    add_env "SENTRY_DSN" "$SENTRY_DSN"
fi

# Generate and add DEBUG_SECRET for webhook-debug endpoint
DEBUG_SECRET=$(openssl rand -base64 32)
echo ""
echo "🔐 Generated DEBUG_SECRET for webhook debugging:"
echo "   $DEBUG_SECRET"
echo ""
add_env "DEBUG_SECRET" "$DEBUG_SECRET"

echo ""
echo "✅ Environment variables added to Vercel!"
echo ""
echo "📝 Next steps:"
echo "   1. Update .env.local with the new SUPABASE_SERVICE_ROLE_KEY"
echo "   2. Update .env.local with DEBUG_SECRET: $DEBUG_SECRET"
echo "   3. Deploy to production: vercel --prod"
echo "   4. Turn off maintenance mode: vercel env rm MAINTENANCE_MODE production"
echo ""
