'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('Confirming your account...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check URL hash for auth tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const type = hashParams.get('type')
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        console.log('Auth callback - type:', type, 'hasAccessToken:', !!accessToken)

        if (type === 'recovery' && accessToken) {
          // Password recovery flow - redirect to reset password page
          setMessage('Redirecting to password reset...')
          router.push('/auth/reset-password')
          return
        }

        // Handle email change confirmation
        if (accessToken && refreshToken && type === 'email_change') {
          setMessage('Confirming your new email...')

          // Set the session using tokens from the URL hash
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('Failed to set session:', sessionError)
            toast({
              title: 'Error',
              description: 'There was an error confirming your new email. Please try again.',
              variant: 'destructive',
            })
            router.push('/dashboard/settings')
            return
          }

          if (sessionData.session) {
            // Sync the new email to the profiles table
            const newEmail = sessionData.session.user.email
            if (newEmail) {
              const { error: updateError } = await (supabase as any)
                .from('profiles')
                .update({
                  email: newEmail,
                  updated_at: new Date().toISOString()
                })
                .eq('id', sessionData.session.user.id)

              if (updateError) {
                console.error('Failed to sync email to profile:', updateError)
              }
            }

            toast({
              title: 'Email updated successfully!',
              description: `Your email has been changed to ${newEmail}.`,
            })
            router.push('/dashboard/settings')
            return
          }
        }

        // For signup/email confirmation, we need to set the session from URL tokens
        if (accessToken && refreshToken && (type === 'signup' || type === 'email' || type === 'magiclink')) {
          setMessage('Confirming your email...')

          // Set the session using tokens from the URL hash
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('Failed to set session:', sessionError)
            toast({
              title: 'Authentication Error',
              description: 'There was an error confirming your account. Please try signing in.',
              variant: 'destructive',
            })
            router.push('/auth')
            return
          }

          if (sessionData.session) {
            // Note: ConvertKit subscription removed from signup flow to prevent duplicate emails.
            // Users are added to ConvertKit when they:
            // 1. Subscribe to the newsletter
            // 2. Download a lead magnet
            // 3. Upgrade to Pro (via Stripe webhook)

            toast({
              title: 'Email confirmed successfully!',
              description: 'Welcome to AI PropertyWriter. Your account is now active.',
            })
            router.push('/dashboard')
            return
          }
        }

        // Fallback: Check if there's already a session (e.g., from auto-detection)
        // Give the Supabase client a moment to process any URL tokens
        await new Promise(resolve => setTimeout(resolve, 500))

        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          toast({
            title: 'Authentication Error',
            description: 'There was an error confirming your account. Please try signing in.',
            variant: 'destructive',
          })
          router.push('/auth')
          return
        }

        if (data.session) {
          // User is successfully logged in after email confirmation
          toast({
            title: 'Email confirmed successfully!',
            description: 'Welcome to AI PropertyWriter. Your account is now active.',
          })
          router.push('/dashboard')
        } else {
          // No session found, redirect to auth
          console.log('No session found in callback, redirecting to auth')
          router.push('/auth')
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        toast({
          title: 'Something went wrong',
          description: 'Please try signing in again.',
          variant: 'destructive',
        })
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router, toast])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">{message}</h1>
          <p className="text-muted-foreground">Please wait while we verify your email.</p>
        </div>
      </div>
    )
  }

  return null
}
