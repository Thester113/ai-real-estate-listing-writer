'use client';

import { PostHog } from 'posthog-js';

let posthogClient: PostHog | null = null;

// Initialize PostHog
export function initPostHog() {
  if (typeof window === 'undefined') return null;
  
  if (!posthogClient && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    const posthog = require('posthog-js').default;
    
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
      loaded: (posthog: PostHog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug();
      },
      capture_pageview: false, // We'll handle this manually
      autocapture: {
        dom_event_allowlist: ['click'], // Only capture clicks
        element_allowlist: ['a', 'button', 'form', 'input', 'select', 'textarea'],
      },
    });
    
    posthogClient = posthog;
  }
  
  return posthogClient;
}

// Track events
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  const posthog = initPostHog();
  if (posthog) {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }
}

// Track page views
export function trackPageView(pathname: string) {
  const posthog = initPostHog();
  if (posthog) {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      pathname,
    });
  }
}

// Identify user
export function identifyUser(userId: string, traits?: Record<string, any>) {
  const posthog = initPostHog();
  if (posthog) {
    posthog.identify(userId, traits);
  }
}

// Track listing generation
export function trackListingGeneration(properties: {
  propertyType: string;
  features: string[];
  wordCount: number;
  success: boolean;
  plan: string;
}) {
  trackEvent('generate_listing', {
    property_type: properties.propertyType,
    feature_count: properties.features.length,
    word_count: properties.wordCount,
    success: properties.success,
    plan: properties.plan,
  });
}

// Track subscription events
export function trackSubscription(event: 'started' | 'upgraded' | 'cancelled', plan: string) {
  trackEvent(`subscription_${event}`, {
    plan,
    timestamp: new Date().toISOString(),
  });
}

// Server-side analytics for API routes
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