/**
 * CAPTCHA Configuration
 *
 * Uses Cloudflare Turnstile for bot protection on auth forms.
 * The site key is public and used client-side.
 * The secret key is configured in Supabase Dashboard (NOT in this app).
 */

export type CaptchaProvider = 'turnstile' | 'hcaptcha'

export const CAPTCHA_PROVIDER: CaptchaProvider = 'turnstile'

/**
 * Turnstile site key from environment variable.
 * For development, use Cloudflare's test keys:
 * - Always passes: 1x00000000000000000000AA
 * - Always fails: 2x00000000000000000000AB
 * - Forces interactive challenge: 3x00000000000000000000FF
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

/**
 * Check if CAPTCHA is enabled (site key is configured)
 */
export const isCaptchaEnabled = (): boolean => {
  return Boolean(TURNSTILE_SITE_KEY)
}
