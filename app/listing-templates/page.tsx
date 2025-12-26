import { Metadata } from 'next'
import { LeadMagnetPage } from '@/components/lead-magnet-page'

export const metadata: Metadata = {
  title: '5 Proven Listing Description Templates - Free Download',
  description: 'Get copy-paste templates for luxury, family, investment, modern, and starter homes. Save hours writing property descriptions.',
  keywords: ['listing templates', 'property description templates', 'real estate templates', 'listing copy', 'property descriptions'],
}

export default function ListingTemplatesPage() {
  const benefits = [
    'Save hours writing property descriptions from scratch',
    'Proven templates that convert browsers into buyers',
    'Professional-quality copy you can customize',
    'Templates for luxury, family, investment, modern, and starter homes',
    'Instant download - start using immediately',
    'Includes tips on how to customize each template'
  ]

  const preview = (
    <div className="space-y-3">
      <div className="bg-secondary/50 p-4 rounded-lg">
        <p className="font-semibold mb-2">Luxury Home Template:</p>
        <p className="text-sm text-muted-foreground italic">
          "Experience refined elegance in this architecturally stunning estate.
          Every detail has been meticulously curated to create an unparalleled living experience..."
        </p>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        + 4 more complete templates
      </p>
    </div>
  )

  const testimonial = {
    quote: "These templates saved me so much time! I just fill in the details and I have a professional listing in minutes.",
    author: "Jennifer M., Real Estate Agent"
  }

  return (
    <LeadMagnetPage
      title="5 Proven Listing Description Templates"
      subtitle="Copy-paste templates for luxury, family, investment, modern, and starter homes that sell faster"
      benefits={benefits}
      tags={['Lead Magnet', 'Listing Templates']}
      preview={preview}
      testimonial={testimonial}
    />
  )
}
