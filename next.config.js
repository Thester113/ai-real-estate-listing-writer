/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs')

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@sentry/nextjs'],
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'AI Real Estate Listing Writer',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhobxnavetcsyzgdnedi.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZob2J4bmF2ZXRjc3l6Z2RuZWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTQ3NzIsImV4cCI6MjA4MjE5MDc3Mn0.cVORCtqywiaINUs3aD6gqSKEQn7qgy_1fSxd2SFNQ7E',
  },
}

module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN 
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    })
  : nextConfig