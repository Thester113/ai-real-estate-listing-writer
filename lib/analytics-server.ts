// Server-side analytics for API routes
// This file is separate from lib/analytics.ts which is client-only ('use client')

export function trackServerEvent(eventName: string, properties?: Record<string, any>) {
  // Only track in production to avoid noise
  if (process.env.NODE_ENV !== 'production') return;

  // Use PostHog's server-side API
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    fetch(`${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com'}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        event: eventName,
        properties: {
          ...properties,
          $lib: 'node-server',
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch(console.error);
  }
}
