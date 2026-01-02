'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { TURNSTILE_SITE_KEY, isCaptchaEnabled } from '@/lib/captcha-config'

export interface CaptchaWidgetRef {
  reset: () => void
}

interface CaptchaWidgetProps {
  onToken: (token: string | null) => void
  onError?: (error: Error) => void
  className?: string
}

/**
 * CAPTCHA Widget using Cloudflare Turnstile
 *
 * This component wraps Turnstile in a form-friendly interface.
 * It automatically handles token generation and expiry.
 *
 * Usage:
 * ```tsx
 * const captchaRef = useRef<CaptchaWidgetRef>(null)
 * const [captchaToken, setCaptchaToken] = useState<string | null>(null)
 *
 * // In form submit:
 * captchaRef.current?.reset()
 *
 * <CaptchaWidget ref={captchaRef} onToken={setCaptchaToken} />
 * ```
 */
export const CaptchaWidget = forwardRef<CaptchaWidgetRef, CaptchaWidgetProps>(
  function CaptchaWidget({ onToken, onError, className }, ref) {
    const turnstileRef = useRef<TurnstileInstance | null>(null)

    useImperativeHandle(ref, () => ({
      reset: () => {
        turnstileRef.current?.reset()
        onToken(null)
      },
    }))

    // If CAPTCHA is not configured, render nothing
    // Forms should still work (Supabase won't require token if not enabled)
    if (!isCaptchaEnabled()) {
      return null
    }

    return (
      <div className={className}>
        <Turnstile
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          options={{
            theme: 'auto',
            size: 'flexible',
          }}
          onSuccess={(token) => onToken(token)}
          onExpire={() => onToken(null)}
          onError={(error) => {
            onToken(null)
            onError?.(new Error(error || 'CAPTCHA verification failed'))
          }}
        />
      </div>
    )
  }
)
