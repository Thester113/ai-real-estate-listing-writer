import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { EmailCapture } from '@/components/email-capture'
import { ArrowLeft, Calendar, Clock, User, Tag } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const revalidate = 3600 // Revalidate every hour

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  published: boolean
  created_at: string
  updated_at: string
  metadata: {
    author: string
    category: string
    readTime: string
    tags?: string[]
    seo_title?: string
    seo_description?: string
  }
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()

    if (error) {
      console.error('Error fetching blog post:', error.message)
      return null
    }

    return data as BlogPost
  } catch (error) {
    console.error('Unexpected error fetching blog post:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPost(params.slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.aipropertywriter.com'
  const postUrl = `${baseUrl}/blog/${params.slug}`

  return {
    title: post.metadata?.seo_title || post.title,
    description: post.metadata?.seo_description || post.excerpt,
    keywords: post.metadata?.tags || [],
    alternates: {
      canonical: `/blog/${params.slug}`,
    },
    openGraph: {
      title: post.metadata?.seo_title || post.title,
      description: post.metadata?.seo_description || post.excerpt,
      type: 'article',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: [post.metadata?.author || 'AI PropertyWriter'],
      tags: post.metadata?.tags || [],
      url: postUrl,
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metadata?.seo_title || post.title,
      description: post.metadata?.seo_description || post.excerpt,
      images: [`${baseUrl}/og-image.png`],
    },
  }
}

export async function generateStaticParams() {
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('published', true)

    if (error) {
      console.error('Error fetching blog slugs for static params:', error.message)
      return []
    }

    return posts?.map((post: { slug: string }) => ({
      slug: post.slug,
    })) || []
  } catch (error) {
    console.error('Unexpected error in generateStaticParams:', error)
    return []
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug)

  if (!post) {
    notFound()
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.aipropertywriter.com'

  // Prepare structured data for Article schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: `${baseUrl}/og-image.png`,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.metadata?.author || 'AI PropertyWriter',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AI Property Writer',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${post.slug}`,
    },
    keywords: post.metadata?.tags?.join(', ') || '',
    articleSection: post.metadata?.category || 'Real Estate',
    wordCount: post.content?.split(/\s+/).length || 0,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Header */}
        <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/blog"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </div>
        </header>

        {/* Article */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumbs */}
          <nav className="text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-primary">Home</Link>
            {' / '}
            <Link href="/blog" className="hover:text-primary">Blog</Link>
            {' / '}
            <span>{post.metadata?.category || 'Article'}</span>
          </nav>

          {/* Post Header */}
          <header className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                {post.metadata?.category || 'Article'}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                {post.metadata?.author || 'AI PropertyWriter'}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(post.created_at)}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {post.metadata?.readTime || '5 min read'}
              </div>
            </div>
          </header>

          {/* Excerpt */}
          <div className="text-xl text-muted-foreground mb-8 pb-8 border-b">
            {post.excerpt}
          </div>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-bold
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:mb-6 prose-p:leading-relaxed
              prose-ul:my-6 prose-ul:space-y-2
              prose-li:leading-relaxed
              prose-strong:text-foreground prose-strong:font-semibold
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.metadata?.tags && post.metadata.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <div className="flex items-center flex-wrap gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {post.metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Email Capture CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-3">Want More Real Estate Marketing Tips?</h2>
              <p className="text-muted-foreground">
                Get weekly insights, strategies, and industry news delivered to your inbox
              </p>
            </div>
            <EmailCapture
              variant="default"
              title="Subscribe to Our Newsletter"
              description="Join real estate professionals getting actionable tips"
              placeholder="Enter your email"
              buttonText="Get Free Tips"
              tags={['Blog Reader', post.metadata?.category || 'General']}
              className="max-w-md mx-auto"
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t mt-12">
          <p className="text-xs text-muted-foreground">
            © 2025 TGHSoftwareLLC. All rights reserved.
          </p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link className="text-xs hover:underline underline-offset-4" href="/terms">
              Terms of Service
            </Link>
            <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
              Privacy Policy
            </Link>
          </nav>
        </footer>
      </div>
    </>
  )
}
