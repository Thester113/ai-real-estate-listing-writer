import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@/components/analytics'
import { ErrorBoundary } from '@/components/error-boundary'
import { cn } from '@/lib/utils'
import { MAINTENANCE_MODE_ENABLED, MAINTENANCE_CONFIG } from '@/lib/maintenance'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'AI PropertyWriter - AI Real Estate Listing Writer',
    template: '%s | AI PropertyWriter'
  },
  description: 'Generate compelling real estate listings with AI. Transform property details into professional, engaging descriptions that attract buyers.',
  keywords: ['real estate', 'AI', 'listings', 'property descriptions', 'real estate marketing', 'AI property writer', 'artificial intelligence'],
  authors: [{ name: 'AI PropertyWriter' }],
  creator: 'AI PropertyWriter',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'AI PropertyWriter - AI Real Estate Listing Writer',
    description: 'Generate compelling real estate listings with AI',
    siteName: 'AI PropertyWriter',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI PropertyWriter - AI Real Estate Listing Writer',
    description: 'Generate compelling real estate listings with AI',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check for maintenance mode
  if (MAINTENANCE_MODE_ENABLED) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={cn(
          inter.className,
          'min-h-screen bg-background font-sans antialiased'
        )}>
          <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-8">
              <div className="space-y-4">
                <div className="text-6xl">🚧</div>
                <h1 className="text-3xl font-bold text-foreground">{MAINTENANCE_CONFIG.title}</h1>
                <p className="text-muted-foreground text-lg">
                  {MAINTENANCE_CONFIG.description}
                </p>
              </div>

              <div className="space-y-4 p-6 bg-card border rounded-lg">
                <h2 className="text-xl font-semibold">Coming Soon</h2>
                <ul className="text-left space-y-2 text-muted-foreground">
                  {MAINTENANCE_CONFIG.features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Want to be notified when we launch?
                </p>
                <a 
                  href={`mailto:${MAINTENANCE_CONFIG.contactEmail}?subject=Notify me when ${MAINTENANCE_CONFIG.companyName} launches`}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
                >
                  📧 Get Launch Updates
                </a>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>© 2024 {MAINTENANCE_CONFIG.companyName}. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        inter.className,
        'min-h-screen bg-background font-sans antialiased'
      )}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}