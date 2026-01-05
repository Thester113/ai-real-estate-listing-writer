// X/Twitter API wrapper using OAuth 2.0 with PKCE
// Uses Twitter API v2

import crypto from 'crypto'
import { getSocialConfig, PLATFORM_SCOPES, PLATFORM_CHAR_LIMITS } from '../social-media-config'

const TWITTER_API_BASE = 'https://api.twitter.com/2'
const TWITTER_OAUTH_BASE = 'https://twitter.com/i/oauth2'
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token'

export interface TwitterTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope: string
  token_type: string
}

export interface TwitterUser {
  id: string
  name: string
  username: string
}

export interface TwitterPostResult {
  success: boolean
  postId?: string
  error?: string
}

// Generate PKCE code verifier and challenge
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  // Generate a random code verifier (43-128 characters)
  const codeVerifier = crypto.randomBytes(32).toString('base64url')

  // Generate code challenge (SHA256 hash of verifier, base64url encoded)
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  return { codeVerifier, codeChallenge }
}

// Generate OAuth authorization URL with PKCE
export function getTwitterAuthUrl(state: string, codeChallenge: string): string {
  const config = getSocialConfig().twitter
  const scopes = PLATFORM_SCOPES.twitter.join(' ')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
    scope: scopes,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  return `${TWITTER_OAUTH_BASE}/authorize?${params.toString()}`
}

// Exchange authorization code for tokens
export async function exchangeTwitterCode(
  code: string,
  codeVerifier: string
): Promise<TwitterTokenResponse> {
  const config = getSocialConfig().twitter

  // Twitter requires Basic auth for client credentials
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')

  const response = await fetch(TWITTER_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Twitter token exchange failed: ${error}`)
  }

  return response.json()
}

// Refresh access token
export async function refreshTwitterToken(refreshToken: string): Promise<TwitterTokenResponse> {
  const config = getSocialConfig().twitter
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')

  const response = await fetch(TWITTER_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Twitter token refresh failed: ${error}`)
  }

  return response.json()
}

// Get authenticated user info
export async function getTwitterUser(accessToken: string): Promise<TwitterUser> {
  const response = await fetch(`${TWITTER_API_BASE}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get Twitter user: ${error}`)
  }

  const data = await response.json()
  return data.data
}

// Post a tweet
export async function postToTwitter(
  accessToken: string,
  content: string
): Promise<TwitterPostResult> {
  try {
    // Ensure content is within limits
    if (content.length > PLATFORM_CHAR_LIMITS.twitter) {
      return {
        success: false,
        error: `Tweet exceeds ${PLATFORM_CHAR_LIMITS.twitter} character limit`,
      }
    }

    const response = await fetch(`${TWITTER_API_BASE}/tweets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: content,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[Twitter] Post failed:', errorData)

      // Handle specific error cases
      if (response.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        }
      }

      return {
        success: false,
        error: `Twitter API error: ${response.status} - ${JSON.stringify(errorData)}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      postId: data.data?.id,
    }
  } catch (error) {
    console.error('[Twitter] Post error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Format blog post content for Twitter (concise, engaging)
export function formatTwitterContent(
  title: string,
  url: string,
  tags?: string[]
): string {
  const maxLength = PLATFORM_CHAR_LIMITS.twitter
  const urlLength = 23 // Twitter shortens all URLs to ~23 characters

  // Build hashtags (limit to 2-3 for Twitter)
  const hashtags = tags?.slice(0, 2).map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ') || '#RealEstate'
  const hashtagLength = hashtags.length + 2 // +2 for spacing

  // Calculate available space for title
  const availableForTitle = maxLength - urlLength - hashtagLength - 4 // -4 for newlines and spacing

  // Truncate title if needed
  let displayTitle = title
  if (title.length > availableForTitle) {
    displayTitle = title.substring(0, availableForTitle - 3) + '...'
  }

  return `${displayTitle}\n\n${url}\n\n${hashtags}`
}
