/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs')

const nextConfig = {
  // Ensure consistent URLs without trailing slashes (matches sitemap)
  trailingSlash: false,
  experimental: {
    serverComponentsExternalPackages: ['@sentry/nextjs'],
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  // Force the correct production URL for metadata (prevents VERCEL_URL fallback)
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://www.aipropertywriter.com',
  },
  // Ensure metadata uses the correct canonical URL
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
        ],
      },
    ]
  },
}

module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN 
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    })
  : nextConfig