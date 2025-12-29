import Link from 'next/link'
import Image from 'next/image'
import { Mail, MessageSquare, Clock } from 'lucide-react'
import { ContactForm } from '@/components/contact-form'
import { ThemeToggle } from '@/components/theme-toggle'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Support | AI Property Writer',
  description: 'Get in touch with our support team. We\'re here to help with any questions about AI Property Writer, our real estate listing generator.',
  openGraph: {
    title: 'Contact Support | AI Property Writer',
    description: 'Get in touch with our support team. We\'re here to help with any questions about AI Property Writer.',
    type: 'website',
  },
}

export default function ContactPage() {
  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact AI Property Writer Support',
    description: 'Contact our support team for help with AI Property Writer, the AI-powered real estate listing generator.',
    url: 'https://www.aipropertywriter.com/contact',
  }

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AI Property Writer',
    url: 'https://www.aipropertywriter.com',
    logo: 'https://www.aipropertywriter.com/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@aipropertywriter.com',
      contactType: 'Customer Support',
      availableLanguage: 'English',
      areaServed: 'US'
    },
    sameAs: [
      'https://www.facebook.com/profile.php?id=61585644513349',
      'https://x.com/writerai20789'
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
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
          <section className="w-full py-12 md:py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <div className="container px-4 md:px-6 mx-auto max-w-4xl">
              <div className="flex flex-col items-center text-center mb-12">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
                  Contact Support
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Have a question or need help? We're here to assist you. Fill out the form below or email us directly.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-3 mb-12">
                <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg border">
                  <Mail className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Email Us</h3>
                  <a
                    href="mailto:support@aipropertywriter.com"
                    className="text-sm text-primary hover:underline"
                  >
                    support@aipropertywriter.com
                  </a>
                </div>

                <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg border">
                  <MessageSquare className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Response Time</h3>
                  <p className="text-sm text-muted-foreground">
                    We typically respond within 24 hours on business days
                  </p>
                </div>

                <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg border">
                  <Clock className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Business Hours</h3>
                  <p className="text-sm text-muted-foreground">
                    Monday - Friday<br />9:00 AM - 5:00 PM EST
                  </p>
                </div>
              </div>

              <div className="max-w-2xl mx-auto bg-card p-8 rounded-lg border shadow-sm">
                <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
                <ContactForm />
              </div>
            </div>
          </section>
        </main>

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
            <Link className="text-xs hover:underline underline-offset-4" href="/contact">
              Contact
            </Link>
          </nav>
        </footer>
      </div>
    </>
  )
}
