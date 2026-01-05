// Meta (Facebook) API wrapper for Page posting
// Uses Facebook Graph API v18.0

import { getSocialConfig, PLATFORM_SCOPES } from '../social-media-config'

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0'
const FACEBOOK_OAUTH_BASE = 'https://www.facebook.com/v18.0/dialog/oauth'

export interface MetaTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

export interface MetaLongLivedTokenResponse {
  access_token: string
  token_type: string
  expires_in: number // 5184000 seconds (60 days)
}

export interface MetaPage {
  id: string
  name: string
  access_token: string // Page-specific access token
}

export interface MetaPostResult {
  success: boolean
  postId?: string
  error?: string
}

// Generate OAuth authorization URL
export function getMetaAuthUrl(state: string): string {
  const config = getSocialConfig().meta
  const scopes = PLATFORM_SCOPES.facebook.join(',')

  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    state,
    scope: scopes,
    response_type: 'code',
  })

  return `${FACEBOOK_OAUTH_BASE}?${params.toString()}`
}

// Exchange authorization code for short-lived token
export async function exchangeMetaCode(code: string): Promise<MetaTokenResponse> {
  const config = getSocialConfig().meta

  const params = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code,
  })

  const response = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Meta token exchange failed: ${error}`)
  }

  return response.json()
}

// Exchange short-lived token for long-lived token (60 days)
export async function getLongLivedToken(shortLivedToken: string): Promise<MetaLongLivedTokenResponse> {
  const config = getSocialConfig().meta

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: config.appId,
    client_secret: config.clientSecret,
    fb_exchange_token: shortLivedToken,
  })

  const response = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Meta long-lived token exchange failed: ${error}`)
  }

  return response.json()
}

// Refresh long-lived token (before expiry)
export async function refreshMetaToken(longLivedToken: string): Promise<MetaLongLivedTokenResponse> {
  const config = getSocialConfig().meta

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: config.appId,
    client_secret: config.clientSecret,
    fb_exchange_token: longLivedToken,
  })

  const response = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Meta token refresh failed: ${error}`)
  }

  return response.json()
}

// Get pages the user manages (with their page access tokens)
export async function getMetaPages(userAccessToken: string): Promise<MetaPage[]> {
  const response = await fetch(
    `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token`,
    {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get Meta pages: ${error}`)
  }

  const data = await response.json()
  return data.data || []
}

// Get long-lived page access token
export async function getPageLongLivedToken(
  pageId: string,
  userLongLivedToken: string
): Promise<string> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${pageId}?fields=access_token`,
    {
      headers: {
        Authorization: `Bearer ${userLongLivedToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get page token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

// Post to a Facebook Page
export async function postToFacebook(
  pageAccessToken: string,
  pageId: string,
  message: string,
  linkUrl?: string
): Promise<MetaPostResult> {
  try {
    interface PostBody {
      message: string
      link?: string
    }

    const postBody: PostBody = {
      message,
    }

    // Add link if provided
    if (linkUrl) {
      postBody.link = linkUrl
    }

    const response = await fetch(`${GRAPH_API_BASE}/${pageId}/feed`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[Facebook] Post failed:', errorData)

      // Handle specific error cases
      if (errorData.error?.code === 190) {
        return {
          success: false,
          error: 'Access token expired. Please reconnect your Facebook Page.',
        }
      }

      return {
        success: false,
        error: `Facebook API error: ${errorData.error?.message || response.status}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      postId: data.id,
    }
  } catch (error) {
    console.error('[Facebook] Post error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Format blog post content for Facebook (conversational, can be longer)
export function formatFacebookContent(
  title: string,
  excerpt: string,
  url: string,
  tags?: string[]
): string {
  const hashtags = tags?.slice(0, 3).map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ') || '#RealEstate #AI'

  return `${title}\n\n${excerpt}\n\nRead more: ${url}\n\n${hashtags}`
}
