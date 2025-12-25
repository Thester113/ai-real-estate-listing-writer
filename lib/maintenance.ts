// Maintenance mode configuration
// Enable maintenance mode based on environment

const isMaintenanceModeEnabled = () => {
  if (typeof window !== 'undefined') {
    // Client-side check - disable maintenance for staging domain
    if (window.location.hostname === 'passinc.vercel.app') {
      return false // Always allow staging environment
    }
    
    // Enable maintenance for production domains
    return window.location.hostname === 'aipropertywriter.com' || 
           window.location.hostname === 'www.aipropertywriter.com'
  }
  
  // Server-side check - disable for Vercel staging URLs
  const url = process.env.NEXT_PUBLIC_APP_URL || ''
  if (url.includes('passinc.vercel.app') || url.includes('vercel.app')) {
    return false // Always allow staging/preview deployments
  }
  
  // Enable maintenance for production domains
  return url.includes('aipropertywriter.com')
}

// Enable maintenance mode only for production domain, never for staging
export const MAINTENANCE_MODE_ENABLED = isMaintenanceModeEnabled()

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