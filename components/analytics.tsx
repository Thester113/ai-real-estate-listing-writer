'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initPostHog, trackPageView } from '@/lib/analytics'
import { initSentry } from '@/lib/sentry'

export function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    // Initialize Sentry
    initSentry()
    
    // Initialize PostHog
    initPostHog()
  }, [])

  useEffect(() => {
    // Track page views
    if (pathname) {
      trackPageView(pathname)
    }
  }, [pathname])

  return null
}