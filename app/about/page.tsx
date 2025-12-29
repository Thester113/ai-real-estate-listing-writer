import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, TrendingUp, Share2 } from 'lucide-react'
import { Footer } from '@/components/footer'
import { ThemeToggle } from '@/components/theme-toggle'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | AI Property Writer',
  description: 'Learn about AI Property Writer - the only AI platform that gives you 3 listing variations, social media posts, and market intelligence. Save 10+ hours per week with professional real estate copywriting.',
  openGraph: {
    title: 'About Us | AI Property Writer',
    description: 'The only AI platform built specifically for real estate professionals. Generate 3 listing variations, social posts, and market-powered copy instantly.',
    type: 'website',
  },
}

export default function AboutPage() {
  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About AI Property Writer',
    description: 'Learn about AI Property Writer - the only AI platform that generates 3 listing variations, Instagram/Facebook posts, and market-powered copy for real estate professionals.',
    url: 'https://www.aipropertywriter.com/about',
  }

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AI Property Writer',
    url: 'https://www.aipropertywriter.com',
    logo: 'https://www.aipropertywriter.com/logo.png',
    description: 'The most advanced AI listing platform for real estate. Generate 3 listing variations, Instagram/Facebook posts, and market-powered copy in seconds.',
    sameAs: [
      'https://www.facebook.com/profile.php?id=61585644513349'
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
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
              src="/logo.png"
              alt="AI Property Writer"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="ml-2 font-bold text-lg">AI Property Writer</span>
          </Link>
          <nav className="ml-auto flex items-center gap-4 sm:gap-6">
            <Link className="text-sm font-medium hover:underline underline-offset-4" href="/pricing">
              Pricing
            </Link>
            <Link className="text-sm font-medium hover:underline underline-offset-4" href="/blog">
              Blog
            </Link>
            <Link className="text-sm font-medium hover:underline underline-offset-4" href="/auth">
              Sign In
            </Link>
            <ThemeToggle />
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero Section */}
          <section className="w-full py-12 md:py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <div className="container px-4 md:px-6 mx-auto max-w-4xl">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-2">
                  <Sparkles className="h-4 w-4 mr-2" />
                  About AI Property Writer
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  The Only AI Platform Built for Real Estate Professionals
                </h1>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                  We help real estate agents save time and sell properties faster with AI-powered copywriting that delivers 3 variations, social media posts, and market intelligence—all in one click.
                </p>
              </div>
            </div>
          </section>

          {/* Mission Section */}
          <section className="w-full py-12 md:py-24">
            <div className="container px-4 md:px-6 mx-auto max-w-4xl">
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
                    Our Mission
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-[700px] mx-auto">
                    To empower real estate agents with the most advanced AI copywriting tools, saving them 10+ hours per week while creating listings that sell properties faster.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Why We Built This Section */}
          <section className="w-full py-12 md:py-24 bg-muted/50">
            <div className="container px-4 md:px-6 mx-auto max-w-4xl">
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
                    Why We Built AI Property Writer
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-[700px] mx-auto mb-8">
                    We saw real estate agents spending 2-3 hours crafting a single listing, then scrambling to create social media posts, only to wonder if their copy was competitive in the local market.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="bg-card p-6 rounded-lg border">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">The Problem</h3>
                    <p className="text-muted-foreground">
                      Writing high-quality listings took hours. Creating social media posts was an afterthought. Market data was missing.
                    </p>
                  </div>

                  <div className="bg-card p-6 rounded-lg border">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">The Gap</h3>
                    <p className="text-muted-foreground">
                      Other AI tools gave you one generic listing. No variations. No social media. No market intelligence.
                    </p>
                  </div>

                  <div className="bg-card p-6 rounded-lg border">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Share2 className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">The Solution</h3>
                    <p className="text-muted-foreground">
                      AI Property Writer delivers 3 variations, Instagram/Facebook posts, and Redfin market data—instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* What Makes Us Different Section */}
          <section className="w-full py-12 md:py-24">
            <div className="container px-4 md:px-6 mx-auto max-w-4xl">
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
                    What Makes Us Different
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-[700px] mx-auto mb-8">
                    The only platform with variations, market data, and social media—all in one click
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-6 bg-card rounded-lg border">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">✨</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">3 Variations, Every Time</h3>
                      <p className="text-muted-foreground">
                        Never settle for one version. Get Professional, Storytelling, and Luxury variations for every property. Choose the one that resonates or use all three for A/B testing.
                      </p>
                      <div className="mt-3 text-sm">
                        <span className="text-red-600">❌ Other tools:</span> Single generic listing<br />
                        <span className="text-green-600">✅ Us:</span> 3 distinct variations + social media
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-card rounded-lg border">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">📱</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Social Media Ready</h3>
                      <p className="text-muted-foreground">
                        Every listing comes with Instagram captions + hashtags and Facebook posts. Copy, paste, post—done. No more staring at a blank screen wondering what to write.
                      </p>
                      <div className="mt-3 text-sm">
                        <span className="text-red-600">❌ Other tools:</span> Listings only<br />
                        <span className="text-green-600">✅ Us:</span> Listings + Instagram + Facebook
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-card rounded-lg border border-primary/50">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        Market-Powered Intelligence
                        <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">PRO</span>
                      </h3>
                      <p className="text-muted-foreground">
                        Real Redfin data automatically woven into your listings. Show buyers you know the market with median prices, trends, and competitive insights. Stand out as the local expert.
                      </p>
                      <div className="mt-3 text-sm">
                        <span className="text-red-600">❌ Other tools:</span> No market context<br />
                        <span className="text-green-600">✅ Us:</span> Real-time Redfin market data (Pro)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="w-full py-12 md:py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <div className="container px-4 md:px-6 mx-auto max-w-4xl">
              <div className="flex flex-col items-center text-center space-y-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Ready to Save 10+ Hours Per Week?
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-lg">
                  Join 1,000+ agents who trust AI Property Writer to generate professional listings, social media posts, and market-powered copy instantly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth">
                    <Button size="lg" className="h-12 px-8">
                      Try it Free – No Credit Card Required
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" size="lg" className="h-12 px-8">
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}
