import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase-client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Always use production domain to avoid env var issues
  const baseUrl = 'https://www.aipropertywriter.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/listing-templates`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/seo-checklist`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ai-listing-guide`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/words-that-sell`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // Get published blog posts from database
  const { data: posts } = await (supabaseAdmin as any)
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('published', true)
    .order('updated_at', { ascending: false })

  const blogPages: MetadataRoute.Sitemap = posts?.map((post: any) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  })) || []

  return [...staticPages, ...blogPages]
}
