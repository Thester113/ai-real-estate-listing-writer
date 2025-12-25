// Maintenance mode configuration
// Enable maintenance mode based on environment

const isProductionDomain = () => {
  if (typeof window !== 'undefined') {
    // Client-side check
    return window.location.hostname === 'aipropertywriter.com' || 
           window.location.hostname === 'www.aipropertywriter.com'
  }
  
  // Server-side check
  return process.env.NEXT_PUBLIC_APP_URL === 'https://aipropertywriter.com' ||
         process.env.NEXT_PUBLIC_APP_URL === 'https://www.aipropertywriter.com' ||
         process.env.VERCEL_ENV === 'production'
}

// Enable maintenance mode only for production domain
export const MAINTENANCE_MODE_ENABLED = isProductionDomain()

export const MAINTENANCE_CONFIG = {
  title: "We're Getting Ready!",
  description: "PropertyWriter is currently in development. We're putting the finishing touches on our AI-powered real estate listing generator.",
  features: [
    "AI-generated property listings",
    "Professional copywriting templates", 
    "Multiple export formats",
    "Advanced targeting options"
  ],
  contactEmail: "contact@aipropertywriter.com",
  companyName: "PropertyWriter"
}