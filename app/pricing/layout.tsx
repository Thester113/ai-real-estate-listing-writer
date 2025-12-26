import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing Plans',
  description: 'Choose the perfect plan for your real estate business. Start free with 20 listings per month or upgrade to Pro for unlimited AI-powered property descriptions.',
  keywords: ['real estate pricing', 'AI listing writer cost', 'property description pricing', 'real estate software pricing', 'MLS generator pricing'],
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Pricing Plans - AI Property Writer',
    description: 'Start free or upgrade to Pro for unlimited AI-powered property listings',
    url: 'https://www.aipropertywriter.com/pricing',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing Plans - AI Property Writer',
    description: 'Start free or upgrade to Pro for unlimited AI-powered property listings',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
