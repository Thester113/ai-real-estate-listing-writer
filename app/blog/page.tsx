import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import NewsletterForm from '@/components/newsletter-form'
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase-client'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Real Estate Marketing Blog - AI PropertyWriter',
  description: 'Expert tips, strategies, and industry insights for creating better property listings and growing your real estate business',
  keywords: ['real estate blog', 'marketing tips', 'listing strategies', 'property descriptions', 'real estate copywriting'],
}

export const revalidate = 3600 // Revalidate every hour

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  published_at: string
  tags: string[]
  metadata: {
    author: string
    category: string
    readTime: string
  }
}

async function getBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select('id, title, slug, excerpt, published_at, tags, metadata')
    .eq('published', true)
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch blog posts:', error)
    return []
  }

  return data as BlogPost[] || []
}

export default async function BlogPage() {
  const blogPosts = await getBlogPosts()

  // Extract unique categories from posts
  const allCategories = blogPosts.map(post => post.metadata?.category).filter(Boolean)
  const uniqueCategories = Array.from(new Set(allCategories))
  const categories = ['All Posts', ...uniqueCategories]
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
              <h1 className="text-xl font-bold">Blog</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/auth">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Real Estate Marketing Insights
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Expert tips, strategies, and industry insights to help you create better listings and grow your business
          </p>
        </div>
      </section>

      {/* Blog Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Categories Filter */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All Posts" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Featured Post */}
          <div className="mb-12">
            <div className="bg-card border rounded-lg shadow-lg overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <div className="h-64 md:h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-6xl text-primary/40">📝</div>
                  </div>
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">Featured</span>
                    <span>{blogPosts[0].metadata?.category || 'Article'}</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-3">
                    <Link href={`/blog/${blogPosts[0].slug}`} className="hover:text-primary transition-colors">
                      {blogPosts[0].title}
                    </Link>
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {blogPosts[0].excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {blogPosts[0].metadata?.author || 'AI PropertyWriter'}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(blogPosts[0].published_at)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {blogPosts[0].metadata?.readTime || '5 min read'}
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link href={`/blog/${blogPosts[0].slug}`}>
                        Read More
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blog Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.slice(1).map((post) => (
              <article key={post.id} className="bg-card border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <div className="text-4xl text-primary/40">📄</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
                    <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs">
                      {post.metadata?.category || 'Article'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3">
                    <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {post.metadata?.author || 'AI PropertyWriter'}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.metadata?.readTime || '5 min read'}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/blog/${post.slug}`}>
                        Read
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {formatDate(post.published_at)}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Load More Button */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Articles
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Stay Updated with Real Estate Marketing Tips
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Get weekly insights, strategies, and industry news delivered to your inbox
          </p>
          <NewsletterForm />
          <p className="text-sm text-muted-foreground mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2025 AI Real Estate Listing Writer. All rights reserved.
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
  )
}