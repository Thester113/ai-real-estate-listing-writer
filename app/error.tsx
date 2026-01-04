'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Something went wrong
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We encountered an unexpected error. Please try again or return to the homepage.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => reset()} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <Button asChild variant="outline" className="flex-1">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Error Details:
            </h3>
            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-auto max-h-32">
              {error.message}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
