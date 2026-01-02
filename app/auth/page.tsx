'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/utils'
import { Eye, EyeOff, ArrowLeft, Mail, CheckCircle2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { CaptchaWidget, type CaptchaWidgetRef } from '@/components/captcha-widget'
import { isCaptchaEnabled } from '@/lib/captcha-config'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [resending, setResending] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<CaptchaWidgetRef>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Check if form can be submitted (CAPTCHA token required if enabled)
  const canSubmit = !loading && (!isCaptchaEnabled() || captchaToken)

  const handleResendEmail = async () => {
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      toast({
        title: 'Email sent!',
        description: 'Check your inbox for the confirmation link.',
      })
    } catch (error) {
      toast({
        title: 'Failed to resend',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setResending(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            captchaToken: captchaToken || undefined,
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) throw error

        if (data.user) {
          // Check if email confirmation is required
          if (!data.session) {
            // Email confirmation required - show confirmation screen
            // Note: ConvertKit subscription happens after email confirmation in /auth/callback
            setEmailSent(true)
          } else {
            // User is immediately logged in (no email confirmation required)
            // Note: ConvertKit subscription removed to prevent duplicate emails
            toast({
              title: 'Welcome to AI PropertyWriter!',
              description: 'Your account has been created and you are now signed in.',
            })
            router.push('/dashboard')
          }
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: { captchaToken: captchaToken || undefined },
        })

        if (error) throw error

        if (data.user) {
          toast({
            title: 'Welcome back!',
            description: 'You have been signed in successfully.',
          })
          router.push('/dashboard')
        }
      }
    } catch (error) {
      toast({
        title: 'Authentication failed',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      // Reset CAPTCHA for next attempt
      captchaRef.current?.reset()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <Link 
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Link>

        <div className="bg-card border rounded-lg shadow-lg p-6">
          {emailSent ? (
            /* Email Confirmation Screen */
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Mail className="h-8 w-8 text-primary" />
              </div>

              <h1 className="text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-muted-foreground mb-6">
                We sent a confirmation link to<br />
                <strong className="text-foreground">{email}</strong>
              </p>

              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  What to do next:
                </h3>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">1.</span>
                    Open your email inbox
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">2.</span>
                    Find the email from AI PropertyWriter
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">3.</span>
                    Click "Confirm Email Address" button
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">4.</span>
                    You'll be signed in automatically
                  </li>
                </ol>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Didn't receive the email? Check your spam folder or
                </p>
                <Button
                  variant="outline"
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="w-full"
                >
                  {resending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend confirmation email
                    </>
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailSent(false)
                    setIsSignUp(false)
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Use a different email or sign in
                </button>
              </div>
            </div>
          ) : (
            /* Sign Up / Sign In Form */
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {isSignUp
                    ? 'Start generating professional real estate listings with AI'
                    : 'Sign in to your account to continue'
                  }
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignUp}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 pr-10 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
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
              {isSignUp && (
                <p className="text-xs text-muted-foreground mt-1">
                  Password must be at least 6 characters long
                </p>
              )}
              {!isSignUp && (
                <div className="mt-1 text-right">
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            <CaptchaWidget
              ref={captchaRef}
              onToken={setCaptchaToken}
              className="flex justify-center"
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!canSubmit}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-primary hover:underline"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>

              {isSignUp && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    By creating an account, you agree to our{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Features reminder */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>✨ 20 free listings per month to start</p>
          <p>🎯 Target specific buyer demographics</p>
          <p>📈 Increase property views and inquiries</p>
        </div>
      </div>
    </div>
  )
}