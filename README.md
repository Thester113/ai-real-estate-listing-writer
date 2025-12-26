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
