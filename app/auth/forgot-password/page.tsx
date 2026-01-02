'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/utils'
import { ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import { CaptchaWidget, type CaptchaWidgetRef } from '@/components/captcha-widget'
import { isCaptchaEnabled } from '@/lib/captcha-config'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<CaptchaWidgetRef>(null)
  const { toast } = useToast()

  // Check if form can be submitted (CAPTCHA token required if enabled)
  const canSubmit = !loading && (!isCaptchaEnabled() || captchaToken)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
        captchaToken: captchaToken || undefined,
      })

      if (error) throw error

      setEmailSent(true)
      toast({
        title: 'Reset email sent',
        description: 'Check your inbox for a link to reset your password.',
      })
    } catch (error) {
      toast({
        title: 'Failed to send reset email',
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
        {/* Back to sign in */}
        <Link
          href="/auth"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to sign in
        </Link>

        <div className="bg-card border rounded-lg shadow-lg p-6">
          {emailSent ? (
            // Success state
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-muted-foreground mb-6">
                We&apos;ve sent a password reset link to <strong>{email}</strong>.
                Click the link in the email to reset your password.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
              <Button
                variant="outline"
                onClick={() => setEmailSent(false)}
                className="w-full"
              >
                Try another email
              </Button>
            </div>
          ) : (
            // Form state
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Forgot your password?</h1>
                <p className="text-muted-foreground mt-2">
                  Enter your email and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  Send Reset Link
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
