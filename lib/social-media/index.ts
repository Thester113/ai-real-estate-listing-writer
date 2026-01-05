// Social Media posting module - unified interface for all platforms
// Coordinates posting across LinkedIn, Twitter, and Facebook

import { supabaseAdmin } from '../supabase-client'
import { SocialPlatform, isPlatformEnabled, PLATFORM_NAMES } from '../social-media-config'
import { postToLinkedIn, formatLinkedInContent, refreshLinkedInToken } from './linkedin'
import { postToTwitter, formatTwitterContent, refreshTwitterToken } from './twitter'
import { postToFacebook, formatFacebookContent, refreshMetaToken } from './meta'

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  tags: string[] | null
}

export interface SocialPostResult {
  platform: SocialPlatform
  success: boolean
  postId?: string
  error?: string
}

export interface SocialCredentials {
  id: string
  platform: SocialPlatform
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  account_id: string | null
  account_name: string | null
  metadata: Record<string, unknown>
  is_active: boolean
}

// Get credentials for a platform
export async function getCredentials(platform: SocialPlatform): Promise<SocialCredentials | null> {
  const { data, error } = await supabaseAdmin
    .from('social_credentials')
    .select('*')
    .eq('platform', platform)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  return data as SocialCredentials
}

// Check if token needs refresh (within 7 days of expiry)
function needsTokenRefresh(expiresAt: string | null): boolean {
  if (!expiresAt) return false

  const expiryDate = new Date(expiresAt)
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  return expiryDate <= sevenDaysFromNow
}

// Refresh token for a platform if needed
async function refreshTokenIfNeeded(credentials: SocialCredentials): Promise<SocialCredentials> {
  if (!needsTokenRefresh(credentials.token_expires_at)) {
    return credentials
  }

  if (!credentials.refresh_token) {
    console.warn(`[Social] No refresh token for ${credentials.platform}, cannot refresh`)
    return credentials
  }

  console.log(`[Social] Refreshing token for ${credentials.platform}`)

  try {
    let newAccessToken: string
    let newRefreshToken: string | undefined
    let expiresIn: number

    switch (credentials.platform) {
      case 'linkedin': {
        const result = await refreshLinkedInToken(credentials.refresh_token)
        newAccessToken = result.access_token
        newRefreshToken = result.refresh_token
        expiresIn = result.expires_in
        break
      }
      case 'twitter': {
        const result = await refreshTwitterToken(credentials.refresh_token)
        newAccessToken = result.access_token
        newRefreshToken = result.refresh_token
        expiresIn = result.expires_in
        break
      }
      case 'facebook': {
        const result = await refreshMetaToken(credentials.access_token)
        newAccessToken = result.access_token
        expiresIn = result.expires_in
        break
      }
      default:
        return credentials
    }

    // Calculate new expiry date
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)

    // Update credentials in database
    const { data: updated, error } = await supabaseAdmin
      .from('social_credentials')
      .update({
        access_token: newAccessToken,
        refresh_token: newRefreshToken || credentials.refresh_token,
        token_expires_at: expiresAt.toISOString(),
      })
      .eq('id', credentials.id)
      .select()
      .single()

    if (error) {
      console.error(`[Social] Failed to update token for ${credentials.platform}:`, error)
      return credentials
    }

    console.log(`[Social] Token refreshed for ${credentials.platform}`)
    return updated as SocialCredentials
  } catch (error) {
    console.error(`[Social] Token refresh failed for ${credentials.platform}:`, error)
    return credentials
  }
}

// Build the blog post URL
function getBlogUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.aipropertywriter.com'
  return `${baseUrl}/blog/${slug}`
}

// Post to a single platform
async function postToPlatform(
  platform: SocialPlatform,
  blogPost: BlogPost,
  credentials: SocialCredentials
): Promise<SocialPostResult> {
  const url = getBlogUrl(blogPost.slug)
  const tags = blogPost.tags || []

  try {
    // Refresh token if needed
    credentials = await refreshTokenIfNeeded(credentials)

    switch (platform) {
      case 'linkedin': {
        if (!credentials.account_id) {
          return { platform, success: false, error: 'No organization ID configured' }
        }
        const content = formatLinkedInContent(blogPost.title, blogPost.excerpt || '', url, tags)
        const result = await postToLinkedIn(credentials.access_token, credentials.account_id, content, url)
        return { platform, ...result }
      }

      case 'twitter': {
        const content = formatTwitterContent(blogPost.title, url, tags)
        const result = await postToTwitter(credentials.access_token, content)
        return { platform, ...result }
      }

      case 'facebook': {
        const pageAccessToken = (credentials.metadata as { page_access_token?: string })?.page_access_token || credentials.access_token
        if (!credentials.account_id) {
          return { platform, success: false, error: 'No page ID configured' }
        }
        const content = formatFacebookContent(blogPost.title, blogPost.excerpt || '', url, tags)
        const result = await postToFacebook(pageAccessToken, credentials.account_id, content, url)
        return { platform, ...result }
      }

      default:
        return { platform, success: false, error: 'Unknown platform' }
    }
  } catch (error) {
    console.error(`[Social] Error posting to ${platform}:`, error)
    return {
      platform,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Record post result in database
async function recordPostResult(
  blogPostId: string,
  result: SocialPostResult,
  content: string
): Promise<void> {
  try {
    await supabaseAdmin.from('social_posts').insert({
      blog_post_id: blogPostId,
      platform: result.platform,
      platform_post_id: result.postId || null,
      status: result.success ? 'posted' : 'failed',
      post_content: content,
      error_message: result.error || null,
      posted_at: result.success ? new Date().toISOString() : null,
    })
  } catch (error) {
    console.error(`[Social] Failed to record post result:`, error)
  }
}

// Main function: Post to all enabled platforms
export async function postToAllPlatforms(
  blogPost: BlogPost,
  platforms?: SocialPlatform[]
): Promise<SocialPostResult[]> {
  const results: SocialPostResult[] = []
  const url = getBlogUrl(blogPost.slug)

  // Determine which platforms to post to
  const targetPlatforms = platforms || (['linkedin', 'twitter', 'facebook'] as SocialPlatform[])

  for (const platform of targetPlatforms) {
    // Check if platform is enabled (has env vars)
    if (!isPlatformEnabled(platform)) {
      console.log(`[Social] ${PLATFORM_NAMES[platform]} not configured, skipping`)
      results.push({
        platform,
        success: false,
        error: 'Platform not configured',
      })
      continue
    }

    // Get credentials
    const credentials = await getCredentials(platform)
    if (!credentials) {
      console.log(`[Social] No credentials for ${PLATFORM_NAMES[platform]}, skipping`)
      results.push({
        platform,
        success: false,
        error: 'No credentials found. Please connect the account.',
      })
      continue
    }

    // Post to platform
    console.log(`[Social] Posting to ${PLATFORM_NAMES[platform]}...`)
    const result = await postToPlatform(platform, blogPost, credentials)
    results.push(result)

    // Get the content that was posted for recording
    let content = ''
    switch (platform) {
      case 'linkedin':
        content = formatLinkedInContent(blogPost.title, blogPost.excerpt || '', url, blogPost.tags || [])
        break
      case 'twitter':
        content = formatTwitterContent(blogPost.title, url, blogPost.tags || [])
        break
      case 'facebook':
        content = formatFacebookContent(blogPost.title, blogPost.excerpt || '', url, blogPost.tags || [])
        break
    }

    // Record result
    await recordPostResult(blogPost.id, result, content)

    if (result.success) {
      console.log(`[Social] Successfully posted to ${PLATFORM_NAMES[platform]}: ${result.postId}`)
    } else {
      console.error(`[Social] Failed to post to ${PLATFORM_NAMES[platform]}: ${result.error}`)
    }
  }

  return results
}

// Get all connected platforms status
export async function getConnectedPlatforms(): Promise<
  Array<{
    platform: SocialPlatform
    connected: boolean
    accountName: string | null
    tokenExpiresAt: string | null
    needsRefresh: boolean
  }>
> {
  const platforms: SocialPlatform[] = ['linkedin', 'twitter', 'facebook']
  const status = []

  for (const platform of platforms) {
    const credentials = await getCredentials(platform)

    status.push({
      platform,
      connected: !!credentials,
      accountName: credentials?.account_name || null,
      tokenExpiresAt: credentials?.token_expires_at || null,
      needsRefresh: credentials ? needsTokenRefresh(credentials.token_expires_at) : false,
    })
  }

  return status
}

// Re-export types and functions from individual modules
export { formatLinkedInContent } from './linkedin'
export { formatTwitterContent } from './twitter'
export { formatFacebookContent } from './meta'
