'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Track error with analytics if available
    if (typeof window !== 'undefined') {
      try {
        // Send to Sentry if configured
        if (window.Sentry) {
          window.Sentry.captureException(error, {
            contexts: {
              errorBoundary: {
                componentStack: errorInfo.componentStack
              }
            }
          })
        }
        
        // Track with PostHog if configured
        if (window.posthog) {
          window.posthog.capture('error_boundary_triggered', {
            error_message: error.message,
            error_stack: error.stack,
            component_stack: errorInfo.componentStack
          })
        }
      } catch (trackingError) {
        console.error('Error tracking failed:', trackingError)
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
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
              An unexpected error occurred. Don't worry, our team has been notified and we're working to fix it.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Error Details:
                </h3>
                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-auto max-h-32">
                  {this.state.error.message}
                  {this.state.error.stack && `\n\nStack trace:\n${this.state.error.stack}`}
                </pre>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={this.handleReset} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button onClick={this.handleReload} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
            </div>
            
            <div className="mt-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                If this problem persists, please contact our support team at{' '}
                <a 
                  href="mailto:support@airealestatelistings.com" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  support@airealestatelistings.com
                </a>
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

declare global {
  interface Window {
    Sentry?: any
    posthog?: any
  }
}