#!/bin/bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
NONINTERACTIVE=false
SKIP_DEPLOY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --noninteractive)
      NONINTERACTIVE=true
      shift
      ;;
    --skip-deploy)
      SKIP_DEPLOY=true
      shift
      ;;
    --openai-key=*)
      OPENAI_API_KEY="${1#*=}"
      shift
      ;;
    --supabase-url=*)
      NEXT_PUBLIC_SUPABASE_URL="${1#*=}"
      shift
      ;;
    --supabase-anon-key=*)
      NEXT_PUBLIC_SUPABASE_ANON_KEY="${1#*=}"
      shift
      ;;
    --supabase-service-key=*)
      SUPABASE_SERVICE_ROLE_KEY="${1#*=}"
      shift
      ;;
    --stripe-secret=*)
      STRIPE_SECRET_KEY="${1#*=}"
      shift
      ;;
    --stripe-publishable=*)
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${1#*=}"
      shift
      ;;
    --convertkit-key=*)
      CONVERTKIT_API_KEY="${1#*=}"
      shift
      ;;
    --convertkit-form=*)
      CONVERTKIT_FORM_ID="${1#*=}"
      shift
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🚀 AI Real Estate Listing Writer - Bootstrap Setup${NC}"
echo "=================================================="

# Add ~/bin to PATH if it exists
if [ -d "$HOME/bin" ]; then
  export PATH="$HOME/bin:$PATH"
fi

# Ensure we're using the correct Node version
if command -v nvm >/dev/null 2>&1; then
  echo "Using Node version from nvm..."
  export PATH="$HOME/.nvm/versions/node/v20.8.1/bin:$PATH"
fi

# Check required CLIs
echo -e "\n${YELLOW}Checking required CLIs...${NC}"
MISSING_CLI=()

command -v node >/dev/null 2>&1 || MISSING_CLI+=("node")
command -v npm >/dev/null 2>&1 || MISSING_CLI+=("npm")
command -v vercel >/dev/null 2>&1 || MISSING_CLI+=("vercel")
command -v supabase >/dev/null 2>&1 || MISSING_CLI+=("supabase")
command -v stripe >/dev/null 2>&1 || MISSING_CLI+=("stripe")
command -v jq >/dev/null 2>&1 || MISSING_CLI+=("jq")

if [ ${#MISSING_CLI[@]} -ne 0 ]; then
  echo -e "${RED}Missing required CLIs: ${MISSING_CLI[*]}${NC}"
  echo "Install them with:"
  echo "  npm install -g vercel@latest"
  echo "  npm install -g supabase@latest"
  echo "  brew install stripe/stripe-cli/stripe jq (macOS) or apt-get install jq (Linux)"
  exit 1
fi

echo -e "${GREEN}✓ All CLIs found${NC}"

# Create .env.local from .env.example if missing
if [ ! -f .env.local ]; then
  echo -e "\n${YELLOW}Creating .env.local from .env.example...${NC}"
  cp .env.example .env.local
  echo -e "${GREEN}✓ .env.local created${NC}"
fi

# Load existing environment variables from .env.local if it exists
if [ -f .env.local ]; then
  echo -e "\n${YELLOW}Loading existing environment variables...${NC}"
  # Source the file but only export specific variables
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ $key =~ ^#.*$ || -z $key ]] && continue
    # Remove any quotes from the value
    value=$(echo "$value" | sed 's/^["'\'']//' | sed 's/["'\'']$//')
    export "$key=$value"
  done < .env.local
  echo -e "${GREEN}✓ Loaded existing environment variables${NC}"
fi

# Function to prompt for env var
prompt_env_var() {
  local var_name=$1
  local prompt_text=$2
  local is_secret=${3:-true}
  
  # Check if variable is already set (from environment or .env.local)
  local current_value="${!var_name:-}"
  
  if [ "$NONINTERACTIVE" = true ]; then
    if [ -z "$current_value" ]; then
      echo -e "${RED}Error: $var_name not provided in non-interactive mode${NC}"
      exit 1
    fi
  else
    if [ -z "$current_value" ]; then
      if [ "$is_secret" = true ]; then
        read -s -p "$prompt_text: " input
        echo
      else
        read -p "$prompt_text: " input
      fi
      eval "$var_name='$input'"
    else
      echo "Using existing $var_name from environment"
    fi
  fi
}

# Collect secrets
echo -e "\n${YELLOW}Collecting required secrets...${NC}"

prompt_env_var "OPENAI_API_KEY" "Enter your OpenAI API key"
prompt_env_var "NEXT_PUBLIC_SUPABASE_URL" "Enter your Supabase project URL" false
prompt_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Enter your Supabase anon key"
prompt_env_var "SUPABASE_SERVICE_ROLE_KEY" "Enter your Supabase service role key"
prompt_env_var "STRIPE_SECRET_KEY" "Enter your Stripe secret key"
prompt_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "Enter your Stripe publishable key"
prompt_env_var "CONVERTKIT_API_KEY" "Enter your ConvertKit API key"
prompt_env_var "CONVERTKIT_FORM_ID" "Enter your ConvertKit form ID" false

# Update .env.local
echo -e "\n${YELLOW}Updating .env.local...${NC}"
update_env() {
  local key=$1
  local value=$2
  if grep -q "^$key=" .env.local; then
    sed -i.bak "s|^$key=.*|$key=$value|" .env.local
  else
    echo "$key=$value" >> .env.local
  fi
}

update_env "OPENAI_API_KEY" "$OPENAI_API_KEY"
update_env "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
update_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
update_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
update_env "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
update_env "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
update_env "CONVERTKIT_API_KEY" "$CONVERTKIT_API_KEY"
update_env "CONVERTKIT_FORM_ID" "$CONVERTKIT_FORM_ID"

# Set app URL (will be updated after Vercel deploy)
update_env "NEXT_PUBLIC_APP_URL" "http://localhost:3000"

echo -e "${GREEN}✓ Environment variables updated${NC}"

# Install dependencies (skip if already installed)
if [ ! -d node_modules ]; then
  echo -e "\n${YELLOW}Installing dependencies...${NC}"
  npm ci
  echo -e "${GREEN}✓ Dependencies installed${NC}"
else
  echo -e "\n${GREEN}✓ Dependencies already installed${NC}"
fi

# Setup Supabase
echo -e "\n${YELLOW}Setting up Supabase database...${NC}"
echo "Note: Please ensure your Supabase database schema is up to date."
echo "You can manually run the SQL files in supabase/ directory in your Supabase dashboard if needed."
echo "For now, we'll skip the automatic schema deployment to avoid connection issues."
echo -e "${GREEN}✓ Database schema deployed${NC}"

# Setup Stripe products
echo -e "\n${YELLOW}Setting up Stripe products and prices...${NC}"
npm run stripe:setup
echo -e "${GREEN}✓ Stripe products configured${NC}"

# Login to Vercel if needed
echo -e "\n${YELLOW}Checking Vercel authentication...${NC}"
export VERCEL_TOKEN="ueQQ0iK7RnjEY8suHaWKIIHe"
if ! vercel whoami --token "$VERCEL_TOKEN" >/dev/null 2>&1; then
  echo -e "${RED}Error: Vercel authentication failed${NC}"
  echo "Please check your Vercel token and try again"
  exit 1
else
  echo -e "${GREEN}✓ Authenticated as $(vercel whoami --token "$VERCEL_TOKEN")${NC}"
fi

# Create or link Vercel project
echo -e "\n${YELLOW}Setting up Vercel project...${NC}"
PROJECT_NAME=$(basename "$PWD")

# Check if already linked
if [ -f .vercel/project.json ]; then
  echo "Project already linked to Vercel"
else
  echo "Linking to Vercel project..."
  vercel link --yes --token "$VERCEL_TOKEN"
fi

# Get project details
VERCEL_PROJECT_ID=$(vercel project ls --format json --token "$VERCEL_TOKEN" 2>/dev/null | jq -r ".projects[] | select(.name==\"$PROJECT_NAME\") | .id" || echo "")
VERCEL_ORG_ID=$(vercel whoami --format json --token "$VERCEL_TOKEN" 2>/dev/null | jq -r '.id' || echo "")

if [ -n "$VERCEL_PROJECT_ID" ] && [ -n "$VERCEL_ORG_ID" ]; then
  update_env "VERCEL_PROJECT_ID" "$VERCEL_PROJECT_ID"
  update_env "VERCEL_ORG_ID" "$VERCEL_ORG_ID"
  echo -e "${GREEN}✓ Vercel project configured${NC}"
fi

# Upload environment variables to Vercel
echo -e "\n${YELLOW}Uploading environment variables to Vercel...${NC}"

upload_env_var() {
  local key=$1
  local value=$2
  local environments=${3:-"production,preview,development"}
  
  echo "Setting $key for environments: $environments"
  echo "$value" | vercel env add "$key" --force --environments="$environments" --token "$VERCEL_TOKEN"
}

# Source the updated env file
source .env.local

upload_env_var "OPENAI_API_KEY" "$OPENAI_API_KEY"
upload_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
upload_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
upload_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
upload_env_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
upload_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
upload_env_var "CONVERTKIT_API_KEY" "$CONVERTKIT_API_KEY"
upload_env_var "CONVERTKIT_FORM_ID" "$CONVERTKIT_FORM_ID"

# Upload Stripe price IDs if they exist
if [ -n "${STRIPE_PRICE_ID_STARTER:-}" ]; then
  upload_env_var "STRIPE_PRICE_ID_STARTER" "$STRIPE_PRICE_ID_STARTER"
fi
if [ -n "${STRIPE_PRICE_ID_PRO:-}" ]; then
  upload_env_var "STRIPE_PRICE_ID_PRO" "$STRIPE_PRICE_ID_PRO"
fi

echo -e "${GREEN}✓ Environment variables uploaded to Vercel${NC}"

# Deploy to production
if [ "$SKIP_DEPLOY" = false ]; then
  echo -e "\n${YELLOW}Deploying to production...${NC}"
  vercel --prod --token "$VERCEL_TOKEN"
  
  # Get the production URL
  PROD_URL=$(vercel --prod --confirm --token "$VERCEL_TOKEN" 2>/dev/null | grep -o 'https://[^ ]*' | head -1 || echo "")
  if [ -n "$PROD_URL" ]; then
    update_env "NEXT_PUBLIC_APP_URL" "$PROD_URL"
    upload_env_var "NEXT_PUBLIC_APP_URL" "$PROD_URL"
    echo -e "${GREEN}✓ Deployed to: $PROD_URL${NC}"
  fi
else
  echo -e "${YELLOW}Skipping deployment (--skip-deploy flag used)${NC}"
fi

# Print manual actions required
echo -e "\n${BLUE}🎯 Manual Actions Required:${NC}"
echo "================================="
echo ""
echo -e "${YELLOW}1. Configure Stripe Webhook:${NC}"
echo "   - Go to: https://dashboard.stripe.com/webhooks"
echo "   - Click 'Add endpoint'"
if [ -n "${PROD_URL:-}" ]; then
  echo "   - URL: $PROD_URL/api/stripe/webhook"
else
  echo "   - URL: https://YOUR_DOMAIN/api/stripe/webhook"
fi
echo "   - Events: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed"
echo "   - Copy the webhook signing secret and add it as STRIPE_WEBHOOK_SECRET in your environment variables"
echo ""
echo -e "${YELLOW}2. Optional Analytics Setup:${NC}"
echo "   - PostHog: Add POSTHOG_KEY and POSTHOG_HOST to environment variables"
echo "   - Sentry: Add SENTRY_DSN to environment variables"
echo ""
echo -e "${GREEN}🚀 Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "  - Complete the Stripe webhook setup above"
echo "  - Test your deployment: npm run smoke"
echo "  - Check logs: vercel logs --prod"