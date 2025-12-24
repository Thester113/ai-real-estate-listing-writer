import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
      
      beforeSend(event, hint) {
        // Filter out common browser errors
        const error = hint.originalException;
        if (error && error instanceof Error) {
          // Skip non-actionable errors
          if (
            error.message.includes('ResizeObserver loop limit exceeded') ||
            error.message.includes('Non-Error promise rejection captured') ||
            error.message.includes('Loading chunk')
          ) {
            return null;
          }
        }
        
        // Don't send events in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Sentry Error (dev):', event);
          return null;
        }
        
        return event;
      },
      
      beforeSendTransaction(event) {
        // Sample transactions in production
        if (process.env.NODE_ENV === 'production' && Math.random() > 0.1) {
          return null;
        }
        return event;
      },
    });
  }
}

// Custom error boundary for React components
export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        component: 'listing-generator',
      },
      extra: context,
    });
  } else {
    console.error('Error:', error, context);
  }
}

// Performance monitoring
export function startTransaction(name: string, operation: string) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }
  return null;
}

// Add breadcrumb for debugging
export function addBreadcrumb(message: string, category: string = 'custom', level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    });
  }
}