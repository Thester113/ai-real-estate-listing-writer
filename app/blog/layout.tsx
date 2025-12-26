import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Real Estate Marketing Blog',
  description: 'Expert tips, strategies, and industry insights for creating better property listings and growing your real estate business',
  keywords: ['real estate blog', 'marketing tips', 'listing strategies', 'property descriptions', 'real estate copywriting'],
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Real Estate Marketing Blog - AI Property Writer',
    description: 'Expert tips, strategies, and industry insights for creating better property listings',
    url: 'https://www.aipropertywriter.com/blog',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real Estate Marketing Blog - AI Property Writer',
    description: 'Expert tips, strategies, and industry insights for creating better property listings',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
