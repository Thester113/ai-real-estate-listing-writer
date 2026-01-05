// Social media configuration utility for LinkedIn, X/Twitter, and Meta
// Follows the pattern from lib/stripe-config.ts

function cleanEnvVar(value: string | undefined): string {
  if (!value) return ''
  return value.replace(/[\r\n\t]/g, '').trim()
}

export interface PlatformConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  enabled: boolean
}

export interface SocialMediaConfig {
  linkedin: PlatformConfig
  twitter: PlatformConfig
  meta: PlatformConfig & {
    appId: string  // Meta uses appId instead of clientId
  }
}

export type SocialPlatform = 'linkedin' | 'twitter' | 'facebook'

// Get the appropriate social media config
export const getSocialConfig = (): SocialMediaConfig => {
  const baseUrl = cleanEnvVar(process.env.NEXT_PUBLIC_APP_URL) || 'http://localhost:3000'

  return {
    linkedin: {
      clientId: cleanEnvVar(process.env.LINKEDIN_CLIENT_ID),
      clientSecret: cleanEnvVar(process.env.LINKEDIN_CLIENT_SECRET),
      redirectUri: cleanEnvVar(process.env.LINKEDIN_REDIRECT_URI) || `${baseUrl}/api/social/callback/linkedin`,
      enabled: !!cleanEnvVar(process.env.LINKEDIN_CLIENT_ID) && !!cleanEnvVar(process.env.LINKEDIN_CLIENT_SECRET),
    },
    twitter: {
      clientId: cleanEnvVar(process.env.TWITTER_CLIENT_ID),
      clientSecret: cleanEnvVar(process.env.TWITTER_CLIENT_SECRET),
      redirectUri: cleanEnvVar(process.env.TWITTER_REDIRECT_URI) || `${baseUrl}/api/social/callback/twitter`,
      enabled: !!cleanEnvVar(process.env.TWITTER_CLIENT_ID) && !!cleanEnvVar(process.env.TWITTER_CLIENT_SECRET),
    },
    meta: {
      appId: cleanEnvVar(process.env.META_APP_ID),
      clientId: cleanEnvVar(process.env.META_APP_ID), // Meta uses appId as clientId
      clientSecret: cleanEnvVar(process.env.META_APP_SECRET),
      redirectUri: cleanEnvVar(process.env.META_REDIRECT_URI) || `${baseUrl}/api/social/callback/meta`,
      enabled: !!cleanEnvVar(process.env.META_APP_ID) && !!cleanEnvVar(process.env.META_APP_SECRET),
    },
  }
}

// Check if a specific platform is configured
export const isPlatformEnabled = (platform: SocialPlatform): boolean => {
  const config = getSocialConfig()
  switch (platform) {
    case 'linkedin':
      return config.linkedin.enabled
    case 'twitter':
      return config.twitter.enabled
    case 'facebook':
      return config.meta.enabled
    default:
      return false
  }
}

// Get list of enabled platforms
export const getEnabledPlatforms = (): SocialPlatform[] => {
  const platforms: SocialPlatform[] = ['linkedin', 'twitter', 'facebook']
  return platforms.filter(isPlatformEnabled)
}

// Validate config for a specific platform
export const validatePlatformConfig = (platform: SocialPlatform): { valid: boolean; missing: string[] } => {
  const config = getSocialConfig()
  const missing: string[] = []

  switch (platform) {
    case 'linkedin':
      if (!config.linkedin.clientId) missing.push('LINKEDIN_CLIENT_ID')
      if (!config.linkedin.clientSecret) missing.push('LINKEDIN_CLIENT_SECRET')
      break
    case 'twitter':
      if (!config.twitter.clientId) missing.push('TWITTER_CLIENT_ID')
      if (!config.twitter.clientSecret) missing.push('TWITTER_CLIENT_SECRET')
      break
    case 'facebook':
      if (!config.meta.appId) missing.push('META_APP_ID')
      if (!config.meta.clientSecret) missing.push('META_APP_SECRET')
      break
  }

  return { valid: missing.length === 0, missing }
}

// Platform display names
export const PLATFORM_NAMES: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  twitter: 'X (Twitter)',
  facebook: 'Facebook',
}

// OAuth scopes required for each platform
export const PLATFORM_SCOPES: Record<SocialPlatform, string[]> = {
  linkedin: ['w_organization_social', 'r_organization_social'], // Company page posting
  twitter: ['tweet.write', 'tweet.read', 'users.read', 'offline.access'], // OAuth 2.0 with PKCE
  facebook: ['pages_manage_posts', 'pages_read_engagement'], // Page posting
}

// Character limits for each platform
export const PLATFORM_CHAR_LIMITS: Record<SocialPlatform, number> = {
  linkedin: 3000,
  twitter: 280,
  facebook: 63206,
}
