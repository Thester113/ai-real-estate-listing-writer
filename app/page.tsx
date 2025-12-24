import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Home, Zap, Users, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <Home className="h-6 w-6 text-primary" />
          <span className="ml-2 font-bold text-lg">AI Listing Writer</span>
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
                Transform Property Details into 
                <span className="text-primary"> Compelling Listings</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Generate professional, engaging real estate descriptions with AI. Save time and attract more buyers with listings that convert.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/auth">
                <Button size="lg" className="h-12 px-8">
                  Start Generating
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
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-12">
            Why Choose AI Listing Writer?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Zap className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-bold">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Generate professional listings in seconds, not hours. Perfect for busy agents and property managers.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <Users className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-bold">Audience Targeted</h3>
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
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Ready to Transform Your Listings?
            </h2>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-lg">
              Start with 20 free listings per month. Join thousands of real estate professionals who save time and increase conversions.
            </p>
            <Link href="/auth">
              <Button size="lg" className="h-12 px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2025 AI Real Estate Listing Writer. All rights reserved.
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
  )
}