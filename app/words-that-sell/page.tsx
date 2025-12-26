import { Metadata } from 'next'
import { LeadMagnetPage } from '@/components/lead-magnet-page'

export const metadata: Metadata = {
  title: '101 Words That Sell Homes Faster - Free Download',
  description: 'High-converting words and phrases for property descriptions. Psychology-backed, category organized, with real examples.',
  keywords: ['real estate copywriting', 'power words', 'listing words', 'property description words', 'real estate vocabulary'],
}

export default function WordsThatSellPage() {
  const benefits = [
    'Instant reference guide with 101 high-converting words',
    'Psychology-backed words that trigger buyer emotions',
    'Organized by category: luxury, family, investment, modern',
    'Real examples showing how to use each word effectively',
    'A/B tested words that outperform generic descriptions',
    'Printable PDF you can keep on your desk',
    'Learn which words to avoid (common mistakes)'
  ]

  const preview = (
    <div className="space-y-3">
      <div className="bg-secondary/50 p-4 rounded-lg">
        <p className="font-semibold mb-2">Power Words Preview:</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Luxury:</p>
            <p className="text-xs">Bespoke, Curated, Exquisite</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Family:</p>
            <p className="text-xs">Welcoming, Spacious, Safe</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Investment:</p>
            <p className="text-xs">Appreciation, Opportunity, ROI</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Modern:</p>
            <p className="text-xs">Sleek, Contemporary, Smart</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        + 89 more power words with examples
      </p>
    </div>
  )

  const testimonial = {
    quote: "I keep this guide open on my second monitor. It's like having a copywriter whispering the perfect words in my ear!",
    author: "David L., Real Estate Broker"
  }

  return (
    <LeadMagnetPage
      title="101 Words That Sell Homes Faster"
      subtitle="High-converting words and phrases for property descriptions - psychology-backed and proven to increase engagement"
      benefits={benefits}
      tags={['Lead Magnet', 'Words That Sell']}
      preview={preview}
      testimonial={testimonial}
    />
  )
}
