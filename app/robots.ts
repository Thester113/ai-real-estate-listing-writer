import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Always use production domain to avoid env var issues in Vercel
  const baseUrl = 'https://www.aipropertywriter.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/billing',
        '/history',
        '/admin',
        '/api/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
