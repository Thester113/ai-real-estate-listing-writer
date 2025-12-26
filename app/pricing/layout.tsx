import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing Plans - AI PropertyWriter',
  description: 'Choose the perfect plan for your real estate business. Start free with 20 listings per month or upgrade to Pro for unlimited generations.',
  keywords: ['real estate pricing', 'AI listing writer cost', 'property description pricing', 'real estate software pricing'],
  openGraph: {
    title: 'Pricing Plans - AI PropertyWriter',
    description: 'Start free or upgrade to Pro for unlimited AI-powered property listings',
  }
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
