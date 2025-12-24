.PHONY: setup dev deploy migrate seed logs clean test typecheck lint smoke

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "AI Real Estate Listing Writer - Development Commands"
	@echo "================================================="
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup Commands
setup: ## Run the complete bootstrap setup
	@echo "🚀 Running bootstrap setup..."
	@chmod +x scripts/bootstrap.sh
	@./scripts/bootstrap.sh

setup-noninteractive: ## Run setup in non-interactive mode (requires env vars)
	@echo "🚀 Running bootstrap setup (non-interactive)..."
	@chmod +x scripts/bootstrap.sh
	@./scripts/bootstrap.sh --noninteractive

##@ Development Commands
dev: ## Start development server
	@echo "🔧 Starting development server..."
	@npm run dev

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	@npm ci

##@ Database Commands
migrate: ## Push database schema to Supabase
	@echo "🗄️  Pushing database schema..."
	@npm run migrate

seed: ## Seed database with sample data
	@echo "🌱 Seeding database..."
	@npm run seed

##@ Stripe Commands
stripe-setup: ## Setup Stripe products and prices
	@echo "💳 Setting up Stripe products..."
	@npm run stripe:setup

stripe-login: ## Login to Stripe CLI
	@stripe login

##@ Deployment Commands
deploy: ## Deploy to Vercel production
	@echo "🚀 Deploying to production..."
	@npm run deploy

logs: ## View production logs
	@echo "📝 Fetching production logs..."
	@vercel logs --prod

##@ Testing Commands
test: ## Run all tests
	@echo "🧪 Running tests..."
	@npm run test

typecheck: ## Run TypeScript type checking
	@echo "🔍 Type checking..."
	@npm run typecheck

lint: ## Run linting
	@echo "🧹 Linting code..."
	@npm run lint

smoke: ## Run smoke tests against deployed app
	@echo "💨 Running smoke tests..."
	@npm run smoke

##@ Quality Commands
check: typecheck lint test ## Run all quality checks
	@echo "✅ All quality checks passed!"

##@ Utility Commands
clean: ## Clean build artifacts and dependencies
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf .next
	@rm -rf node_modules
	@rm -f .env.local.bak

status: ## Show project status
	@echo "📊 Project Status:"
	@echo "=================="
	@echo "Node version: $$(node --version)"
	@echo "NPM version: $$(npm --version)"
	@echo "Git branch: $$(git branch --show-current 2>/dev/null || echo 'Not in git repo')"
	@echo "Vercel project: $$(vercel project ls --format json 2>/dev/null | jq -r '.projects[0].name // "Not linked"' || echo 'Not linked')"
	@echo "Environment: $$(if [ -f .env.local ]; then echo 'Configured'; else echo 'Not configured'; fi)"

env-check: ## Validate environment configuration
	@echo "🔧 Checking environment configuration..."
	@node -e " \
		const required = ['OPENAI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'STRIPE_SECRET_KEY']; \
		const missing = required.filter(key => !process.env[key]); \
		if (missing.length) { \
			console.error('❌ Missing required env vars:', missing.join(', ')); \
			process.exit(1); \
		} else { \
			console.log('✅ All required environment variables are set'); \
		}"