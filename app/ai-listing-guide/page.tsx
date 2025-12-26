import { Metadata } from 'next'
import { LeadMagnetPage } from '@/components/lead-magnet-page'

export const metadata: Metadata = {
  title: 'Complete Guide to AI-Powered Real Estate Listings - Free eBook',
  description: 'Learn how to use AI to write listings that sell faster. 25-page ebook with AI prompts, case studies, and best practices.',
  keywords: ['AI real estate', 'AI listings', 'ChatGPT real estate', 'AI property descriptions', 'real estate AI guide'],
}

export default function AIListingGuidePage() {
  const benefits = [
    'Learn the exact AI prompts that generate high-converting listings',
    'Real before/after case studies showing 40% faster sales',
    'Best practices for using ChatGPT, Claude, and other AI tools',
    'How to maintain your unique voice with AI assistance',
    'ROI analysis: Time and money saved with AI',
    'Step-by-step workflow for AI-powered listing creation',
    'Common mistakes to avoid when using AI for real estate'
  ]

  const preview = (
    <div className="space-y-3">
      <div className="bg-secondary/50 p-4 rounded-lg">
        <p className="font-semibold mb-2">Chapter Preview:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Chapter 1: Why AI is Transforming Real Estate</li>
          <li>• Chapter 2: The Perfect AI Prompt Formula</li>
          <li>• Chapter 3: Case Studies & Results</li>
          <li>• Chapter 4: Advanced Techniques</li>
        </ul>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        25 pages of actionable insights
      </p>
    </div>
  )

  const testimonial = {
    quote: "This guide helped me cut my listing writing time by 75% while actually improving the quality. The prompts are gold!",
    author: "Sarah K., Realtor"
  }

  return (
    <LeadMagnetPage
      title="Complete Guide to AI-Powered Real Estate Listings"
      subtitle="25-page ebook on using AI to write listings that sell faster - with prompts, case studies, and proven strategies"
      benefits={benefits}
      tags={['Lead Magnet', 'AI Guide']}
      preview={preview}
      testimonial={testimonial}
    />
  )
}
