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
    default: 'AI Property Writer – Generate Real Estate Listing Copy Instantly',
    template: '%s | AI Property Writer'
  },
  description: 'Generate MLS descriptions, real estate listing copy, social posts, and property marketing emails in seconds. AIPropertyWriter helps real estate agents market properties faster with AI.',
  keywords: ['AI real estate listing writer', 'MLS description generator', 'real estate listing copy', 'property marketing AI', 'real estate copywriting', 'listing generator', 'real estate marketing'],
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
    title: 'AI Property Writer – Generate Real Estate Listing Copy Instantly',
    description: 'Generate MLS descriptions, real estate listing copy, social posts, and property marketing emails in seconds. AIPropertyWriter helps real estate agents market properties faster with AI.',
    siteName: 'AI Property Writer',
    images: [
      {
        url: 'https://www.aipropertywriter.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Property Writer - Real Estate Listing Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Property Writer – Generate Real Estate Listing Copy Instantly',
    description: 'Generate MLS descriptions, real estate listing copy, social posts, and property marketing emails in seconds.',
    images: ['https://www.aipropertywriter.com/og-image.png'],
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