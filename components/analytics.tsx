'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, trackPageView, identifyUser } from '@/lib/analytics'
import { initSentry } from '@/lib/sentry'
import { supabase } from '@/lib/supabase'

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

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
  }, [pathname, searchParams])

  useEffect(() => {
    // Track authenticated user
    const trackUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Get user profile for additional traits
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, plan, created_at')
            .eq('id', session.user.id)
            .single()

          identifyUser(session.user.id, {
            email: session.user.email,
            full_name: (profile as any)?.full_name,
            plan: (profile as any)?.plan,
            created_at: (profile as any)?.created_at,
            last_sign_in: session.user.last_sign_in_at
          })
        }
      } catch (error) {
        console.error('Analytics user tracking error:', error)
      }
    }

    trackUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        identifyUser(session.user.id, {
          email: session.user.email,
          last_sign_in: session.user.last_sign_in_at
        })
      } else if (event === 'SIGNED_OUT') {
        // Reset user identity
        const posthog = initPostHog()
        if (posthog) {
          posthog.reset()
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Error boundary for analytics
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Analytics error:', error)
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  return null
}