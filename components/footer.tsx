import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="AI Property Writer"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="font-bold text-lg">AI Property Writer</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              The only AI platform that gives you 3 listing variations + social media posts + local market intelligence in one click.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a
                href="https://www.facebook.com/profile.php?id=61585644513349"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/generate" className="text-muted-foreground hover:text-foreground transition-colors">
                  Generate Listing
                </Link>
              </li>
              <li>
                <Link href="/generate/bulk" className="text-muted-foreground hover:text-foreground transition-colors">
                  Bulk Generation
                </Link>
              </li>
              <li>
                <Link href="/listing-templates" className="text-muted-foreground hover:text-foreground transition-colors">
                  Listing Templates
                </Link>
              </li>
              <li>
                <Link href="/seo-checklist" className="text-muted-foreground hover:text-foreground transition-colors">
                  SEO Checklist
                </Link>
              </li>
              <li>
                <Link href="/words-that-sell" className="text-muted-foreground hover:text-foreground transition-colors">
                  Words That Sell
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/ai-listing-guide" className="text-muted-foreground hover:text-foreground transition-colors">
                  AI Listing Guide
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground flex items-center gap-2 opacity-60">
                  API Documentation
                  <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                    Coming Soon
                  </span>
                </span>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  System Status
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} TGHSoftwareLLC. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/sitemap.xml" className="hover:text-foreground transition-colors">
                Sitemap
              </Link>
              <Link href="/rss.xml" className="hover:text-foreground transition-colors">
                RSS Feed
              </Link>
              <span className="text-xs">
                Made with ❤️ for real estate agents
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
