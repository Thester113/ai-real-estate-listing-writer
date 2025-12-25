// Maintenance mode configuration
// Enable maintenance mode based on environment

// Simple manual control for maintenance mode
// Set this to true to enable maintenance mode globally
const FORCE_MAINTENANCE_MODE = true

const isMaintenanceModeEnabled = () => {
  // If force maintenance is off, disable everywhere
  if (!FORCE_MAINTENANCE_MODE) {
    console.log('🔧 Maintenance: FORCE_MAINTENANCE_MODE is false - disabled everywhere')
    return false
  }
  
  if (typeof window !== 'undefined') {
    // Client-side check - disable maintenance for staging domain
    console.log('🔧 Maintenance: Client-side check, hostname:', window.location.hostname)
    if (window.location.hostname === 'passinc.vercel.app') {
      console.log('🔧 Maintenance: Staging domain detected - maintenance disabled')
      return false // Always allow staging environment
    }
    
    // Enable maintenance for production domains when forced
    const isProduction = window.location.hostname === 'aipropertywriter.com' || 
                        window.location.hostname === 'www.aipropertywriter.com'
    console.log('🔧 Maintenance: Production domain check:', isProduction)
    return isProduction
  }
  
  // Server-side check - disable for Vercel staging URLs
  const url = process.env.NEXT_PUBLIC_APP_URL || ''
  console.log('🔧 Maintenance: Server-side check, APP_URL:', url)
  if (url.includes('passinc.vercel.app') || url.includes('vercel.app')) {
    console.log('🔧 Maintenance: Staging URL detected - maintenance disabled')
    return false // Always allow staging/preview deployments
  }
  
  // Enable maintenance for production domains when forced
  const isProduction = url.includes('aipropertywriter.com')
  console.log('🔧 Maintenance: Production URL check:', isProduction)
  return isProduction
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