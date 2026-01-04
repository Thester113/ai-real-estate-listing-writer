'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.aipropertywriter.com" />
        <title>Something went wrong | AI Property Writer</title>
      </head>
      <body className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600">
              We're sorry, but something unexpected happened. Please try again.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => reset()} className="w-full">
              Try again
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              Go to homepage
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
              <p className="text-xs font-mono text-gray-600 break-all">
                {error.message}
              </p>
            </div>
          )}
        </div>
      </body>
    </html>
  )
}
