import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Home, Zap, Users, Star } from 'lucide-react'
import { EmailCapture } from '@/components/email-capture'

export default function HomePage() {
  // Structured data for SEO
  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AI Property Writer',
    description: 'Generate MLS descriptions, real estate listing copy, social posts, and property marketing emails in seconds with AI.',
    url: 'https://www.aipropertywriter.com',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        name: 'Free Trial',
        description: 'Try AI Property Writer free with no credit card required'
      },
      {
        '@type': 'Offer',
        price: '29',
        priceCurrency: 'USD',
        name: 'Premium Plan',
        description: 'Unlimited real estate listing generation'
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
    description: 'AI-powered real estate listing generator helping agents create professional MLS descriptions, social posts, and marketing emails.',
    sameAs: []
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
          <Home className="h-6 w-6 text-primary" />
          <span className="ml-2 font-bold text-lg">AI PropertyWriter</span>
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
                AI Real Estate Listing Generator
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Generate MLS descriptions, social media posts, listing emails, and property marketing copy in seconds. AI-powered real estate listing writer that helps agents market properties faster.
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
          <div className="grid gap-12 lg:gap-16">
            {/* MLS Descriptions */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Generate MLS Descriptions in Seconds
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
                Create professional, compelling MLS description generator output that highlights property features and attracts qualified buyers. Perfect for busy real estate agents.
              </p>
            </div>

            {/* Social Media Posts */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Create Social Media Posts for Listings
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
                Generate engaging social media content for Facebook, Instagram, and LinkedIn. Real estate listing copy optimized for each platform.
              </p>
            </div>

            {/* Listing Emails */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Write Property Marketing Emails
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
                Create personalized listing emails and property announcements that convert leads into showings.
              </p>
            </div>

            {/* Benefits for Real Estate Agents */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Benefits for Real Estate Agents
              </h2>
              <div className="grid gap-8 md:grid-cols-3 mt-8">
                <div className="flex flex-col items-center space-y-4 text-center">
                  <Zap className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Save Hours Every Week</h3>
                  <p className="text-muted-foreground">
                    Generate professional listings in seconds, not hours. Perfect for busy agents and property managers.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-4 text-center">
                  <Users className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Target Your Audience</h3>
                  <p className="text-muted-foreground">
                    Customize tone and content for families, professionals, investors, or any target demographic.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-4 text-center">
                  <Star className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Professional Quality</h3>
                  <p className="text-muted-foreground">
                    AI-powered descriptions that highlight key features and create emotional connections with buyers.
                  </p>
                </div>
              </div>
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
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2025 TGHSoftwareLLC. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="/terms">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
            Privacy Policy
          </Link>
        </nav>
      </footer>
      </div>
    </>
  )
}