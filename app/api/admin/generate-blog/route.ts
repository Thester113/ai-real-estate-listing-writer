import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { slugify } from '@/lib/utils'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface BlogTopicData {
  title: string
  keywords: string[]
  category: string
  author: string
}

interface BlogResult {
  title: string
  content: string
  excerpt: string
  seo_title: string
  seo_description: string
  tags: string[]
}

async function generateBlogPost(topicData: BlogTopicData): Promise<BlogResult> {
  const { title, keywords, category, author } = topicData

  const prompt = `You are an expert real estate content writer and SEO specialist.
Write a comprehensive, engaging blog article about: "${title}"

Keywords to naturally integrate: ${keywords.join(', ')}
Category: ${category}

Requirements:
- Write 1500-2000 words of high-quality, actionable content
- Use proper HTML formatting: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>
- Structure: Introduction + 3-5 main sections (H2) with subsections (H3) + Conclusion
- Professional but approachable tone - write like you're helping a colleague
- Include specific, actionable tips and real examples
- Optimize for SEO with natural keyword integration
- Make it scannable with short paragraphs and lists
- Focus on helping real estate professionals improve their listings
- End with a clear call-to-action

Return ONLY valid JSON in this exact format:
{
  "title": "Compelling 60-character title optimized for clicks",
  "content": "Full HTML article content (1500-2000 words)",
  "excerpt": "Engaging 155-160 character meta description that makes people want to click",
  "seo_title": "SEO-optimized title (50-60 characters)",
  "seo_description": "Meta description optimized for search engines (150-160 characters)",
  "tags": ["3-5 relevant tags as an array"]
}

Guidelines:
- The content should be genuinely helpful, not fluff
- Include specific numbers, statistics, or examples where possible
- Use active voice and strong verbs
- Create urgency without being pushy
- Make it valuable enough that readers want to share it
- Ensure HTML is properly formatted and escaped`

  try {
    console.log('🤖 Calling OpenAI API...')
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    }, {
      timeout: 60000, // 60 second timeout
    })
    console.log('✅ OpenAI API responded successfully')

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated')
    }

    // Parse the JSON response
    const result = JSON.parse(content) as BlogResult

    // Validate required fields
    if (!result.title || !result.content || !result.excerpt || !result.seo_title || !result.seo_description || !result.tags) {
      throw new Error('Missing required fields in generated content')
    }

    return result
  } catch (error) {
    console.error('OpenAI blog generation failed:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack'
    })
    throw error
  }
}

function calculateReadTime(htmlContent: string): string {
  const text = htmlContent.replace(/<[^>]*>/g, '')
  const words = text.split(/\s+/).length
  const minutes = Math.ceil(words / 200)
  return `${minutes} min read`
}

async function checkSlugExists(slug: string): Promise<boolean> {
  const { data } = await (supabaseAdmin as any)
    .from('blog_posts')
    .select('id')
    .eq('slug', slug)
    .single()

  return !!data
}

async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 2

  while (await checkSlugExists(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

export async function POST(request: NextRequest) {
  console.log('📝 Blog generation API called!')

  try {
    const body = await request.json() as BlogTopicData

    console.log('📦 Generating blog post:', body.title)

    // Generate the blog content
    const result = await generateBlogPost(body)

    // Generate slug from title
    const baseSlug = slugify(result.title)
    const uniqueSlug = await generateUniqueSlug(baseSlug)

    // Calculate read time
    const readTime = calculateReadTime(result.content)

    console.log('✅ Blog post generated, slug:', uniqueSlug)

    // Save to database
    const { data: insertResult, error: saveError } = await (supabaseAdmin as any)
      .from('blog_posts')
      .insert({
        title: result.title,
        slug: uniqueSlug,
        content: result.content,
        excerpt: result.excerpt,
        seo_title: result.seo_title,
        seo_description: result.seo_description,
        tags: result.tags,
        published: true,
        metadata: {
          author: body.author,
          category: body.category,
          readTime: readTime,
          keywords: body.keywords
        }
      })
      .select('*')
      .single()

    if (saveError) {
      console.error('❌ Failed to save blog post:', saveError)
      throw new Error(`Database save failed: ${saveError.message}`)
    }

    console.log('✅ Blog post saved to database!')

    return NextResponse.json({
      success: true,
      data: {
        id: insertResult.id,
        title: result.title,
        slug: uniqueSlug,
        readTime: readTime
      }
    })

  } catch (error) {
    console.error('💥 Error generating blog post:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to generate blog post'
    }, { status: 500 })
  }
}
