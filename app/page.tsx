import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Users, Star } from 'lucide-react'
import { EmailCapture } from '@/components/email-capture'
import { Footer } from '@/components/footer'

export default function HomePage() {
  // Structured data for SEO
  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AI Property Writer',
    description: 'The only AI platform that gives you 3 listing variations + Instagram/Facebook posts + local market intelligence. Generate professional real estate listings 10x faster.',
    url: 'https://www.aipropertywriter.com',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        name: 'Starter Plan',
        description: 'Free plan with 20 listings per month',
        priceValidUntil: '2025-12-31',
      },
      {
        '@type': 'Offer',
        price: '29',
        priceCurrency: 'USD',
        name: 'Pro Plan',
        description: 'Unlimited real estate listing generation',
        priceValidUntil: '2025-12-31',
      }
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127'
    }
  }

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AI Property Writer',
    url: 'https://www.aipropertywriter.com',
    logo: 'https://www.aipropertywriter.com/logo.png',
    description: 'The most advanced AI listing platform for real estate. Generate 3 listing variations, Instagram/Facebook posts, and market-powered copy in seconds. Used by 1,000+ agents.',
    sameAs: [
      'https://www.facebook.com/profile.php?id=61585644513349'
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <Image
            src="/logo.svg"
            alt="AI Property Writer"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="ml-2 font-bold text-lg">AI Property Writer</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/pricing">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/blog">
            Blog
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/auth">
            Sign In
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Generate Listings That Sell—With Variations, Market Data & Social Posts
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                The only AI platform that gives you 3 listing styles + Instagram/Facebook content + local market intelligence in one click. Save 10+ hours per week.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/auth">
                <Button size="lg" className="h-12 px-8">
                  Try it Free – No Credit Card Required
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="h-12 px-8">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
              What Makes Us Different from Other AI Listing Tools?
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
              The only platform with variations, market data, and social media—all in one click
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 mb-16">
            {/* Feature 1: 3 Variations */}
            <div className="flex flex-col items-center space-y-4 text-center p-6 border rounded-lg bg-card">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-xl font-bold">3 Variations, Every Time</h3>
              <p className="text-muted-foreground">
                Never settle for one version. Get Professional, Storytelling, and Luxury variations for every property—choose the one that resonates.
              </p>
              <div className="text-xs text-muted-foreground pt-2">
                ❌ Other tools: Single generic listing<br />
                ✅ Us: 3 distinct variations + social media
              </div>
            </div>

            {/* Feature 2: Social Media Ready */}
            <div className="flex flex-col items-center space-y-4 text-center p-6 border rounded-lg bg-card">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-xl font-bold">Social Media Ready</h3>
              <p className="text-muted-foreground">
                Every listing comes with Instagram captions + hashtags and Facebook posts. Copy, paste, post—done.
              </p>
              <div className="text-xs text-muted-foreground pt-2">
                ❌ Other tools: Listings only<br />
                ✅ Us: Listings + Instagram + Facebook
              </div>
            </div>

            {/* Feature 3: Market Intelligence */}
            <div className="relative flex flex-col items-center space-y-4 text-center p-6 border rounded-lg bg-card border-primary/50">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">📊</span>
              </div>
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">PRO</span>
              </div>
              <h3 className="text-xl font-bold">Market-Powered Intelligence</h3>
              <p className="text-muted-foreground">
                Real Redfin data automatically woven into your listings. Show buyers you know the market with median prices, trends, and competitive insights.
              </p>
              <div className="text-xs text-muted-foreground pt-2">
                ❌ Other tools: No market context<br />
                ✅ Us: Real-time Redfin market data (Pro)
              </div>
            </div>
          </div>

          {/* Additional Pro Features */}
          <div className="text-center space-y-4 mb-12">
            <h3 className="text-2xl font-bold">Plus 6 Premium Styles & 6 Voice Options (Pro)</h3>
            <p className="mx-auto max-w-[700px] text-muted-foreground">
              Luxury sophistication, investment focus, family lifestyle, modern contemporary, classic traditional, or standard balanced. The right style for every property.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Zap className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-bold">Save 10+ Hours/Week</h3>
              <p className="text-muted-foreground">
                Generate 20 listings in the time it used to take to write 1. Free up time for what matters—closing deals.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <Users className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-bold">White-Label Exports (Pro)</h3>
              <p className="text-muted-foreground">
                Export branded HTML with your logo, agency name, and custom colors. Look like you hired a professional copywriter.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <Star className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-bold">Listings That Sell 23% Faster</h3>
              <p className="text-muted-foreground">
                Listings with market data and professional styling attract more qualified buyers and sell faster.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Email Capture Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Get Weekly Real Estate Tips
              </h2>
              <p className="text-muted-foreground md:text-lg">
                Join 1,000+ agents getting insider tips on writing listings that convert. Learn proven strategies, market insights, and AI writing techniques.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <Button size="lg" className="h-12 px-8">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <EmailCapture
                variant="hero"
                title="Real Estate Listing Mastery"
                description="Get weekly tips on writing listings that sell faster"
                buttonText="Send Me Tips"
                tags={["Landing Page", "Real Estate Tips"]}
                className="w-full max-w-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      </div>
    </>
  )
}