import { supabaseAdmin } from '@/lib/supabase-client'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.aipropertywriter.com'

  // Fetch published blog posts
  const { data: posts } = await (supabaseAdmin as any)
    .from('blog_posts')
    .select('title, slug, excerpt, created_at, updated_at, metadata')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(50)

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>AI Property Writer Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Expert tips, strategies, and industry insights for creating better property listings and growing your real estate business</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${
      posts
        ?.map(
          (post: any) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
      <author>noreply@aipropertywriter.com (${post.metadata?.author || 'AI PropertyWriter'})</author>
      ${post.metadata?.category ? `<category>${post.metadata.category}</category>` : ''}
    </item>`
        )
        .join('') || ''
    }
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
