import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@/components/analytics'
import { ErrorBoundary } from '@/components/error-boundary'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'PropertyWriter - AI Real Estate Listing Writer',
    template: '%s | PropertyWriter'
  },
  description: 'Generate compelling real estate listings with AI. Transform property details into professional, engaging descriptions that attract buyers.',
  keywords: ['real estate', 'AI', 'listings', 'property descriptions', 'real estate marketing', 'property writer'],
  authors: [{ name: 'PropertyWriter' }],
  creator: 'PropertyWriter',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'PropertyWriter - AI Real Estate Listing Writer',
    description: 'Generate compelling real estate listings with AI',
    siteName: 'PropertyWriter',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PropertyWriter - AI Real Estate Listing Writer',
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