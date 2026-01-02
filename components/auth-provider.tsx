'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'PASSWORD_RECOVERY' && session) {
        // User clicked password reset link - redirect to reset password page
        router.push('/auth/reset-password')
      } else if (event === 'SIGNED_IN' && session) {
        // User successfully signed in (including after email confirmation)
        const currentPath = window.location.pathname

        // If user is on auth page and just signed in, redirect to dashboard
        // But NOT if they're on reset-password page (they're resetting their password)
        if (currentPath === '/auth' || (currentPath.startsWith('/auth/') && currentPath !== '/auth/reset-password')) {
          toast({
            title: 'Welcome back!',
            description: 'You have been signed in successfully.',
          })
          router.push('/dashboard')
        }
      } else if (event === 'SIGNED_OUT') {
        // User signed out - only redirect if on a protected page
        const currentPath = window.location.pathname
        const publicPaths = ['/', '/auth', '/blog', '/pricing', '/contact', '/subscribed', '/privacy', '/terms']
        const isPublicPage = publicPaths.some(p => currentPath === p || currentPath.startsWith('/blog/'))
        if (!isPublicPage) {
          router.push('/')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router, toast])

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}