'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/utils'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user has a valid session (from the recovery link)
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setHasSession(true)
      } else {
        toast({
          title: 'Invalid or expired link',
          description: 'Please request a new password reset link.',
          variant: 'destructive',
        })
        router.push('/auth/forgot-password')
      }
      setSessionLoading(false)
    }
    checkSession()
  }, [router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      toast({
        title: 'Password updated successfully',
        description: 'You can now sign in with your new password.',
      })
      router.push('/dashboard')
    } catch (error) {
      toast({
        title: 'Failed to update password',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">Loading...</h1>
          <p className="text-muted-foreground">Please wait while we verify your session.</p>
        </div>
      </div>
    )
  }

  if (!hasSession) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to sign in */}
        <Link
          href="/auth"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to sign in
        </Link>

        <div className="bg-card border rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Reset your password</h1>
            <p className="text-muted-foreground mt-2">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 pr-10 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 6 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 pr-10 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
