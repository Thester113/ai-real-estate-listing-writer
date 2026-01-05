// LinkedIn API wrapper for company page posting
// Uses LinkedIn Marketing API v2

import { getSocialConfig, PLATFORM_SCOPES } from '../social-media-config'

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2'
const LINKEDIN_OAUTH_BASE = 'https://www.linkedin.com/oauth/v2'

export interface LinkedInTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
  scope: string
}

export interface LinkedInProfile {
  id: string
  localizedFirstName?: string
  localizedLastName?: string
}

export interface LinkedInOrganization {
  id: string
  localizedName: string
  vanityName?: string
}

export interface LinkedInPostResult {
  success: boolean
  postId?: string
  error?: string
}

// Generate OAuth authorization URL
export function getLinkedInAuthUrl(state: string): string {
  const config = getSocialConfig().linkedin
  const scopes = PLATFORM_SCOPES.linkedin.join(' ')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
    scope: scopes,
  })

  return `${LINKEDIN_OAUTH_BASE}/authorization?${params.toString()}`
}

// Exchange authorization code for tokens
export async function exchangeLinkedInCode(code: string): Promise<LinkedInTokenResponse> {
  const config = getSocialConfig().linkedin

  const response = await fetch(`${LINKEDIN_OAUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LinkedIn token exchange failed: ${error}`)
  }

  return response.json()
}

// Refresh access token
export async function refreshLinkedInToken(refreshToken: string): Promise<LinkedInTokenResponse> {
  const config = getSocialConfig().linkedin

  const response = await fetch(`${LINKEDIN_OAUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LinkedIn token refresh failed: ${error}`)
  }

  return response.json()
}

// Get user's administered organizations (company pages)
export async function getLinkedInOrganizations(accessToken: string): Promise<LinkedInOrganization[]> {
  // First get the organization access control list
  const aclResponse = await fetch(
    `${LINKEDIN_API_BASE}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName,vanityName)))`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  )

  if (!aclResponse.ok) {
    const error = await aclResponse.text()
    throw new Error(`Failed to get LinkedIn organizations: ${error}`)
  }

  const data = await aclResponse.json()

  return (data.elements || []).map((element: { 'organization~': LinkedInOrganization }) => ({
    id: element['organization~'].id,
    localizedName: element['organization~'].localizedName,
    vanityName: element['organization~'].vanityName,
  }))
}

// Post to a LinkedIn organization page
export async function postToLinkedIn(
  accessToken: string,
  organizationId: string,
  content: string,
  linkUrl?: string
): Promise<LinkedInPostResult> {
  try {
    // Format organization URN
    const authorUrn = `urn:li:organization:${organizationId}`

    // Build the post body
    interface PostBody {
      author: string
      lifecycleState: string
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: string
          }
          shareMediaCategory: string
          media?: Array<{
            status: string
            originalUrl: string
          }>
        }
      }
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': string
      }
    }

    const postBody: PostBody = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: linkUrl ? 'ARTICLE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }

    // Add link if provided
    if (linkUrl) {
      postBody.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          originalUrl: linkUrl,
        },
      ]
    }

    const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[LinkedIn] Post failed:', errorText)
      return {
        success: false,
        error: `LinkedIn API error: ${response.status} - ${errorText}`,
      }
    }

    // Get the post ID from the response header
    const postId = response.headers.get('x-restli-id') || undefined

    return {
      success: true,
      postId,
    }
  } catch (error) {
    console.error('[LinkedIn] Post error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Format blog post content for LinkedIn (professional tone, longer format)
export function formatLinkedInContent(
  title: string,
  excerpt: string,
  url: string,
  tags?: string[]
): string {
  const hashtags = tags?.slice(0, 5).map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ') || '#RealEstate #AI'

  // LinkedIn allows up to 3000 characters
  let content = `${title}\n\n${excerpt}\n\nRead the full article: ${url}\n\n${hashtags}`

  // Truncate if needed (shouldn't be necessary for blog excerpts)
  if (content.length > 3000) {
    const truncatedExcerpt = excerpt.substring(0, 2500 - title.length - url.length - hashtags.length) + '...'
    content = `${title}\n\n${truncatedExcerpt}\n\nRead the full article: ${url}\n\n${hashtags}`
  }

  return content
}
