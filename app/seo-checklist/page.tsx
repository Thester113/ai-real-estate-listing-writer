import { Metadata } from 'next'
import { LeadMagnetPage } from '@/components/lead-magnet-page'

export const metadata: Metadata = {
  title: 'The Ultimate Real Estate SEO Checklist - Free Download',
  description: 'Make your listings rank #1 on Google with our comprehensive 47-point SEO checklist. Includes keyword research, optimization tips, and more.',
  keywords: ['real estate SEO', 'SEO checklist', 'listing SEO', 'property SEO', 'real estate marketing'],
}

export default function SEOChecklistPage() {
  const benefits = [
    'Get higher rankings on Google and Zillow',
    'Drive more organic traffic to your listings',
    'Actionable checklist with 47 proven tactics',
    'Keyword research templates and tools',
    'Image optimization best practices',
    'Meta description formulas that work',
    'Local SEO strategies for real estate'
  ]

  const preview = (
    <div className="space-y-3">
      <div className="bg-secondary/50 p-4 rounded-lg">
        <p className="font-semibold mb-2">Sample Checklist Items:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>✓ Include target keywords in the first 100 words</li>
          <li>✓ Optimize all images with descriptive alt text</li>
          <li>✓ Add location-specific keywords naturally</li>
          <li>✓ Create compelling meta descriptions (150-160 chars)</li>
        </ul>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        + 43 more optimization tactics
      </p>
    </div>
  )

  const testimonial = {
    quote: "My listings now show up on the first page of Google! This checklist is a game-changer for lead generation.",
    author: "Mark T., Broker"
  }

  return (
    <LeadMagnetPage
      title="The Ultimate Real Estate SEO Checklist"
      subtitle="Make your listings rank #1 on Google with our comprehensive 47-point checklist"
      benefits={benefits}
      tags={['Lead Magnet', 'SEO Checklist']}
      preview={preview}
      testimonial={testimonial}
    />
  )
}
