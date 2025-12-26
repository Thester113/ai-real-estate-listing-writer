/**
 * Blog Topic Selection and Management
 * Handles random selection of unused topics for weekly blog generation
 */

import { supabaseAdmin } from './supabase-client'

export interface BlogTopic {
  id: string
  title: string
  keywords: string[]
  category: string
  author: string
  enabled: boolean
  last_used_at: string | null
  usage_count: number
  created_at: string
  updated_at: string
}

/**
 * Select a random unused topic from the database
 * Algorithm:
 * 1. Get all unused topics (last_used_at IS NULL)
 * 2. If none exist, reset all topics and retry
 * 3. Pick random topic from unused pool
 * 4. Return topic for generation
 */
export async function selectRandomUnusedTopic(): Promise<BlogTopic | null> {
  try {
    // Step 1: Get all unused topics
    const { data: unusedTopics, error: queryError } = await (supabaseAdmin as any)
      .from('blog_topics')
      .select('*')
      .eq('enabled', true)
      .is('last_used_at', null)

    if (queryError) {
      console.error('Error querying unused topics:', queryError)
      throw new Error(`Database query failed: ${queryError.message}`)
    }

    // Step 2: If no unused topics, reset all and retry
    if (!unusedTopics || unusedTopics.length === 0) {
      console.log('No unused topics found. Resetting all topics...')
      await resetAllTopics()

      // Retry query after reset
      const { data: resetTopics, error: retryError } = await (supabaseAdmin as any)
        .from('blog_topics')
        .select('*')
        .eq('enabled', true)
        .is('last_used_at', null)

      if (retryError) {
        console.error('Error querying topics after reset:', retryError)
        throw new Error(`Database query failed after reset: ${retryError.message}`)
      }

      if (!resetTopics || resetTopics.length === 0) {
        console.error('No topics available even after reset')
        return null
      }

      unusedTopics.length = 0
      unusedTopics.push(...resetTopics)
    }

    // Step 3: Pick random topic from unused pool
    const randomIndex = Math.floor(Math.random() * unusedTopics.length)
    const selectedTopic = unusedTopics[randomIndex] as BlogTopic

    console.log(`Selected topic: "${selectedTopic.title}" (${selectedTopic.category})`)
    console.log(`Unused topics remaining: ${unusedTopics.length - 1}`)

    return selectedTopic
  } catch (error) {
    console.error('Error in selectRandomUnusedTopic:', error)
    throw error
  }
}

/**
 * Mark a topic as used after successful blog generation
 * Updates last_used_at timestamp and increments usage_count
 */
export async function markTopicUsed(topicId: string): Promise<void> {
  try {
    const now = new Date().toISOString()

    // First, get the current usage_count
    const { data: topic, error: fetchError } = await (supabaseAdmin as any)
      .from('blog_topics')
      .select('usage_count')
      .eq('id', topicId)
      .single()

    if (fetchError) {
      console.error('Error fetching topic for update:', fetchError)
      throw new Error(`Failed to fetch topic: ${fetchError.message}`)
    }

    // Update with incremented usage_count
    const { error } = await (supabaseAdmin as any)
      .from('blog_topics')
      .update({
        last_used_at: now,
        usage_count: (topic.usage_count || 0) + 1,
        updated_at: now
      })
      .eq('id', topicId)

    if (error) {
      console.error('Error marking topic as used:', error)
      throw new Error(`Failed to mark topic as used: ${error.message}`)
    }

    console.log(`✓ Topic ${topicId} marked as used`)
  } catch (error) {
    console.error('Error in markTopicUsed:', error)
    throw error
  }
}

/**
 * Reset all topics by setting last_used_at to NULL
 * Called when all topics have been used and we need to start a new cycle
 */
export async function resetAllTopics(): Promise<void> {
  try {
    const { error, count } = await (supabaseAdmin as any)
      .from('blog_topics')
      .update({ last_used_at: null })
      .eq('enabled', true)

    if (error) {
      console.error('Error resetting topics:', error)
      throw new Error(`Failed to reset topics: ${error.message}`)
    }

    console.log(`✓ Reset ${count || 'all'} topics for new cycle`)
  } catch (error) {
    console.error('Error in resetAllTopics:', error)
    throw error
  }
}

/**
 * Get statistics about topic usage
 * Useful for monitoring and analytics
 */
export async function getTopicStats(): Promise<{
  total: number
  enabled: number
  unused: number
  used: number
  categoryBreakdown: Record<string, number>
}> {
  try {
    // Get all topics
    const { data: allTopics, error: allError } = await (supabaseAdmin as any)
      .from('blog_topics')
      .select('*')

    if (allError) {
      throw new Error(`Failed to fetch topics: ${allError.message}`)
    }

    // Get unused topics
    const { data: unusedTopics, error: unusedError } = await (supabaseAdmin as any)
      .from('blog_topics')
      .select('id')
      .eq('enabled', true)
      .is('last_used_at', null)

    if (unusedError) {
      throw new Error(`Failed to fetch unused topics: ${unusedError.message}`)
    }

    // Calculate stats
    const total = allTopics?.length || 0
    const enabled = allTopics?.filter((t: BlogTopic) => t.enabled).length || 0
    const unused = unusedTopics?.length || 0
    const used = enabled - unused

    // Category breakdown
    const categoryBreakdown = (allTopics || []).reduce((acc: Record<string, number>, topic: BlogTopic) => {
      if (topic.enabled) {
        acc[topic.category] = (acc[topic.category] || 0) + 1
      }
      return acc
    }, {})

    return {
      total,
      enabled,
      unused,
      used,
      categoryBreakdown
    }
  } catch (error) {
    console.error('Error in getTopicStats:', error)
    throw error
  }
}

/**
 * Get all topics (for admin dashboard or debugging)
 */
export async function getAllTopics(enabledOnly: boolean = false): Promise<BlogTopic[]> {
  try {
    let query = (supabaseAdmin as any)
      .from('blog_topics')
      .select('*')
      .order('created_at', { ascending: true })

    if (enabledOnly) {
      query = query.eq('enabled', true)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch topics: ${error.message}`)
    }

    return (data || []) as BlogTopic[]
  } catch (error) {
    console.error('Error in getAllTopics:', error)
    throw error
  }
}
