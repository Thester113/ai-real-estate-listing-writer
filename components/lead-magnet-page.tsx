'use client'

import Link from 'next/link'
import { EmailCapture } from '@/components/email-capture'
import { ArrowLeft, Check, Download, Shield, Mail } from 'lucide-react'

interface LeadMagnetPageProps {
  title: string
  subtitle: string
  benefits: string[]
  tags: string[]
  preview?: React.ReactNode
  testimonial?: { quote: string; author: string }
}

export function LeadMagnetPage({
  title,
  subtitle,
  benefits,
  tags,
  preview,
  testimonial
}: LeadMagnetPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Minimal Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Download className="h-4 w-4 mr-2" />
              Free Download
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Two-Column Layout */}
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left Column: Benefits */}
            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">What You'll Get:</h2>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <span className="ml-3 text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preview Section */}
              {preview && (
                <div className="bg-card border rounded-lg p-8">
                  <h3 className="text-xl font-bold mb-4">Preview:</h3>
                  {preview}
                </div>
              )}

              {/* Testimonial */}
              {testimonial && (
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border rounded-lg p-6">
                  <p className="text-muted-foreground italic mb-4">
                    "{testimonial.quote}"
                  </p>
                  <p className="font-semibold">— {testimonial.author}</p>
                </div>
              )}

              {/* Trust Signals */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <Shield className="h-8 w-8 text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">100% Free</p>
                </div>
                <div className="flex flex-col items-center">
                  <Mail className="h-8 w-8 text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Instant Access</p>
                </div>
                <div className="flex flex-col items-center">
                  <Download className="h-8 w-8 text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">No Credit Card</p>
                </div>
              </div>
            </div>

            {/* Right Column: Email Capture (Sticky) */}
            <div className="md:sticky md:top-24">
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border-2 border-primary/20">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Get Your Free Copy</h3>
                  <p className="text-muted-foreground">
                    Enter your email and we'll send it to you instantly
                  </p>
                </div>

                <EmailCapture
                  variant="default"
                  title=""
                  description=""
                  placeholder="Enter your email address"
                  buttonText="Send Me The Free Guide"
                  tags={tags}
                  className="w-full"
                />

                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    We respect your privacy. Unsubscribe at any time.
                    <br />
                    No spam, ever.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-secondary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Join Thousands of Real Estate Professionals
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Get actionable tips and resources to grow your real estate business
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <p className="text-muted-foreground">Active Users</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500K+</div>
              <p className="text-muted-foreground">Listings Generated</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">4.9/5</div>
              <p className="text-muted-foreground">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2025 AI PropertyWriter. All rights reserved.
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
