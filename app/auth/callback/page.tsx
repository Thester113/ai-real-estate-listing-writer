'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
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
          <h1 className="text-xl font-semibold mb-2">Confirming your account...</h1>
          <p className="text-muted-foreground">Please wait while we verify your email.</p>
        </div>
      </div>
    )
  }

  return null
}