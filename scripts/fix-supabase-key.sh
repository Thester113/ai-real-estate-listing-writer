#!/bin/bash

# Script to update Supabase service role key in Vercel
# This fixes the "Unregistered API key" error in the billing portal

echo "🔧 Fixing Supabase Service Role Key in Vercel"
echo ""
echo "You need to get your service role key from:"
echo "https://supabase.com/dashboard/project/vhobxnavetcsyzgdnedi/settings/api"
echo ""
echo "The key should:"
echo "  - Start with 'eyJ'"
echo "  - Be very long (100+ characters)"
echo "  - Look like: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo ""

read -p "Paste your Supabase service_role key here: " SERVICE_KEY

# Trim whitespace and newlines
SERVICE_KEY=$(echo "$SERVICE_KEY" | tr -d '\n\r\t ' | xargs)

# Validate it looks like a JWT
if [[ ! $SERVICE_KEY =~ ^eyJ ]]; then
  echo "❌ Error: Key doesn't look like a valid JWT (should start with 'eyJ')"
  exit 1
fi

if [ ${#SERVICE_KEY} -lt 100 ]; then
  echo "❌ Error: Key is too short (should be 100+ characters)"
  exit 1
fi

echo ""
echo "✅ Key looks valid (${#SERVICE_KEY} characters)"
echo ""
echo "Updating Vercel environment variables..."

# Update all environments
vercel env rm SUPABASE_SERVICE_ROLE_KEY production --yes
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<EOF
$SERVICE_KEY
EOF

vercel env rm SUPABASE_SERVICE_ROLE_KEY preview --yes
vercel env add SUPABASE_SERVICE_ROLE_KEY preview <<EOF
$SERVICE_KEY
EOF

vercel env rm SUPABASE_SERVICE_ROLE_KEY development --yes
vercel env add SUPABASE_SERVICE_ROLE_KEY development <<EOF
$SERVICE_KEY
EOF

echo ""
echo "✅ Updated Vercel environment variables"
echo ""
echo "Updating local .env.local file..."

# Update local env file
if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
  # Use @ as delimiter to avoid issues with / in the key
  sed -i.bak "s@SUPABASE_SERVICE_ROLE_KEY=.*@SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY@" .env.local
  rm .env.local.bak
else
  echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY" >> .env.local
fi

echo "✅ Updated .env.local"
echo ""
echo "🚀 Triggering new deployment..."

vercel --prod --yes

echo ""
echo "✅ Done! The billing portal should work once deployment completes."
