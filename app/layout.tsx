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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.aipropertywriter.com'),
  alternates: {
    canonical: 'https://www.aipropertywriter.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.aipropertywriter.com',
    title: 'AI Property Writer – Generate Real Estate Listing Copy Instantly',
    description: 'Generate MLS descriptions, real estate listing copy, social posts, and property marketing emails in seconds. AIPropertyWriter helps real estate agents market properties faster with AI.',
    siteName: 'AI Property Writer',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Property Writer – Generate Real Estate Listing Copy Instantly',
    description: 'Generate MLS descriptions, real estate listing copy, social posts, and property marketing emails in seconds.',
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