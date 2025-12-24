import Link from 'next/link'
import { Button } from '@/components/ui/button'
import NewsletterForm from '@/components/newsletter-form'
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react'

// Mock blog posts - in a real app these would come from a CMS or database
const blogPosts = [
  {
    id: 1,
    title: "5 Essential Elements of High-Converting Real Estate Listings",
    excerpt: "Learn the key components that make property listings stand out and generate more leads. From compelling headlines to detailed descriptions, discover what works.",
    author: "Sarah Johnson",
    date: "2025-01-15",
    readTime: "5 min read",
    category: "Tips & Strategies",
    image: "/api/placeholder/400/250"
  },
  {
    id: 2,
    title: "How AI is Revolutionizing Real Estate Marketing",
    excerpt: "Explore how artificial intelligence is transforming the way real estate professionals create content, target audiences, and generate leads in today's market.",
    author: "Mike Chen",
    date: "2025-01-12",
    readTime: "7 min read",
    category: "Industry Insights",
    image: "/api/placeholder/400/250"
  },
  {
    id: 3,
    title: "Writing Property Descriptions That Sell: A Complete Guide",
    excerpt: "Master the art of property description writing. Learn proven techniques to highlight features, create emotional connections, and drive buyer interest.",
    author: "Lisa Rodriguez",
    date: "2025-01-10",
    readTime: "8 min read",
    category: "Writing Tips",
    image: "/api/placeholder/400/250"
  },
  {
    id: 4,
    title: "The Psychology Behind Effective Real Estate Copy",
    excerpt: "Understand what motivates home buyers and learn how to tap into psychological triggers that make your listings more persuasive and effective.",
    author: "David Thompson",
    date: "2025-01-08",
    readTime: "6 min read",
    category: "Psychology",
    image: "/api/placeholder/400/250"
  },
  {
    id: 5,
    title: "SEO Best Practices for Real Estate Listings in 2025",
    excerpt: "Optimize your property listings for search engines. Learn the latest SEO techniques that help your listings rank higher and attract more organic traffic.",
    author: "Emma Wilson",
    date: "2025-01-05",
    readTime: "9 min read",
    category: "SEO & Marketing",
    image: "/api/placeholder/400/250"
  },
  {
    id: 6,
    title: "Common Mistakes in Real Estate Descriptions and How to Avoid Them",
    excerpt: "Identify and fix the most common errors that hurt listing performance. From overused phrases to missing key details, learn what to avoid.",
    author: "Alex Martinez",
    date: "2025-01-03",
    readTime: "4 min read",
    category: "Best Practices",
    image: "/api/placeholder/400/250"
  }
]

const categories = [
  "All Posts",
  "Tips & Strategies", 
  "Industry Insights",
  "Writing Tips",
  "Psychology",
  "SEO & Marketing",
  "Best Practices"
]

export default function BlogPage() {
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
                    <span>{blogPosts[0].category}</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-3">
                    <Link href={`/blog/${blogPosts[0].id}`} className="hover:text-primary transition-colors">
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
                        {blogPosts[0].author}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(blogPosts[0].date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {blogPosts[0].readTime}
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link href={`/blog/${blogPosts[0].id}`}>
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
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3">
                    <Link href={`/blog/${post.id}`} className="hover:text-primary transition-colors">
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
                        {post.author}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/blog/${post.id}`}>
                        Read
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {new Date(post.date).toLocaleDateString()}
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