import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@/components/analytics'
import { ErrorBoundary } from '@/components/error-boundary'
import { AuthProvider } from '@/components/auth-provider'
import { cn } from '@/lib/utils'
import MaintenanceCheck from '@/components/maintenance-check'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'AI Property Writer – 3 Variations + Social Posts + Market Data',
    template: '%s | AI Property Writer'
  },
  description: 'The only AI platform that generates 3 listing variations, Instagram/Facebook posts, and market-powered copy instantly. Save 10+ hours per week with professional real estate copywriting.',
  keywords: ['AI real estate listing writer', 'MLS description generator', 'real estate listing copy', 'property marketing AI', 'real estate copywriting', 'listing generator', 'real estate marketing', 'social media for real estate', 'Instagram real estate posts', 'market data listings'],
  authors: [{ name: 'AI PropertyWriter' }],
  creator: 'AI PropertyWriter',
  publisher: 'AI PropertyWriter',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.aipropertywriter.com'),
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': 'https://www.aipropertywriter.com/rss.xml',
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.aipropertywriter.com',
    title: 'AI Property Writer – 3 Variations + Social Posts + Market Data',
    description: 'The only AI platform that generates 3 listing variations, Instagram/Facebook posts, and market-powered copy instantly. Save 10+ hours per week.',
    siteName: 'AI Property Writer',
    images: [
      {
        url: 'https://www.aipropertywriter.com/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'AI Property Writer - 3 Variations, Social Posts, Market Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Property Writer – 3 Variations + Social Posts + Market Data',
    description: 'The only AI platform with 3 listing variations, Instagram/Facebook posts, and market intelligence. Save 10+ hours per week.',
    images: ['https://www.aipropertywriter.com/og-image.svg'],
    creator: '@aipropertywriter',
    site: '@aipropertywriter',
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        inter.className,
        'min-h-screen bg-background font-sans antialiased'
      )}>
        <ErrorBoundary>
          <AuthProvider>
            <MaintenanceCheck>
              {children}
            </MaintenanceCheck>
          </AuthProvider>
        </ErrorBoundary>
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}