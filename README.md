# AI Property Writer

Generate professional real estate listing copy, MLS descriptions, social posts, and property marketing emails in seconds using AI.

## What is AI Property Writer?

AI Property Writer is a SaaS application that helps real estate agents create compelling property listings and marketing content instantly. Built with Next.js 14, it uses OpenAI's GPT models to generate tailored copy based on property details, target audience, and desired tone.

**Features:**
- 🏡 AI-powered listing generation
- 📝 Multiple output types (MLS descriptions, social posts, emails)
- 💳 Subscription-based pricing (Starter/Pro tiers)
- 📊 Usage tracking and limits
- 📰 Automated SEO blog system
- 📧 Email marketing integration (ConvertKit)
- 🔐 Secure authentication via Supabase
- 💰 Stripe payment processing

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL + Auth)
- **Payments:** Stripe
- **AI:** OpenAI GPT-4
- **Email:** ConvertKit + Gmail SMTP
- **Deployment:** Vercel
- **Styling:** Tailwind CSS + Radix UI
- **Analytics:** PostHog + Sentry

## Quick Start

### Prerequisites

- Node.js >= 18.17.0
- npm or yarn
- Vercel CLI
- Supabase CLI
- Stripe CLI
- jq (for JSON parsing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd passinc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the bootstrap setup**
   ```bash
   npm run bootstrap
   ```

   This interactive script will:
   - Validate required CLI tools
   - Guide you through environment variable setup
   - Link your Vercel project
   - Push database schema to Supabase
   - Create Stripe products and prices
   - Optionally deploy to production

4. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Manual Setup

If you prefer manual setup over the bootstrap script:

1. Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

2. Configure your environment variables (see `.env.example` for details)

3. Push database schema:
   ```bash
   npm run migrate
   ```

4. Set up Stripe products:
   ```bash
   npm run stripe:setup
   ```

5. Deploy to Vercel:
   ```bash
   npm run deploy
   ```

## Development

```bash
# Start dev server
npm run dev

# Run tests
npm run test
npm run test:watch
npm run test:coverage

# Type checking and linting
npm run typecheck
npm run lint

# Database operations
npm run migrate        # Push schema changes
npm run seed          # Seed sample data

# Build for production
npm run build
npm start
```

## Environment Variables

Required environment variables:

- `OPENAI_API_KEY` - OpenAI API key for listing generation
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `STRIPE_SECRET_KEY` - Stripe secret key (test or live)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `CONVERTKIT_API_KEY` - ConvertKit API key
- `CONVERTKIT_FORM_ID` - ConvertKit form ID

See `.env.example` for all available configuration options.

## Enabling CAPTCHA Protection

The app supports Cloudflare Turnstile CAPTCHA to protect auth flows (sign up, sign in, password reset) from bots and abuse.

### Step 1: Create Turnstile Site

1. Go to [Cloudflare Turnstile Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Click "Add site"
3. Enter your domain(s) (e.g., `yourdomain.com`, `localhost` for dev)
4. Select widget mode: **Managed** (recommended)
5. Copy the **Site Key** and **Secret Key**

### Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** > **Bot and Abuse Protection**
3. Enable **CAPTCHA protection**
4. Select **Cloudflare Turnstile** as the provider
5. Paste the **Secret Key** from Step 1
6. Save changes

### Step 3: Configure Your App

Add the site key to your environment variables:

```bash
# In .env.local
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...  # Your Turnstile site key
```

For Vercel deployments, add this to your project's environment variables.

### Local Development

For local development without a real Turnstile widget, use Cloudflare's test keys:

```bash
# Always passes verification
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA

# Always fails verification (for testing error handling)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=2x00000000000000000000AB
```

**Note:** If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set, CAPTCHA is disabled and forms work normally.

## Project Structure

```
passinc/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   ├── blog/              # Blog pages
│   └── ...                # Other pages
├── components/            # React components
├── lib/                   # Shared utilities and configs
├── supabase/             # Database schema and migrations
├── scripts/              # Setup and maintenance scripts
├── email-templates/      # Email HTML templates
└── types/                # TypeScript type definitions
```

## Deployment

The app is designed to deploy on Vercel:

```bash
npm run deploy
```

### Vercel Configuration

- Function timeouts configured in `vercel.json`
- Cron jobs for weekly blog generation and email digests
- Environment variables must be set in Vercel dashboard

### Database Migrations

Push schema changes to Supabase:

```bash
npm run migrate
```

## Testing Webhooks Locally

To test Stripe webhooks in development:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Update your `.env.local` with the webhook signing secret provided by the CLI.

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive developer guide and architecture documentation
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Supabase configuration details
- **[CONVERTKIT_SETUP_GUIDE.md](./CONVERTKIT_SETUP_GUIDE.md)** - Email marketing setup

## License

See [LICENSE](./LICENSE) file for details.

## Support

For issues, questions, or contributions, please refer to the documentation files or contact the development team.

---

Built with ❤️ for real estate professionals
