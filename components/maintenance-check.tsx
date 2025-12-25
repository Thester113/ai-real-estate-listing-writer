'use client'

import { useEffect, useState } from 'react'
import { MAINTENANCE_CONFIG, MAINTENANCE_MODE_ENABLED } from '@/lib/maintenance'

export default function MaintenanceCheck({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Use the centralized maintenance mode configuration
    console.log('🔧 MaintenanceCheck: MAINTENANCE_MODE_ENABLED:', MAINTENANCE_MODE_ENABLED)
    
    setIsMaintenanceMode(MAINTENANCE_MODE_ENABLED)
    setIsLoading(false)
  }, [])

  // Show loading briefly to prevent flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show maintenance mode for production domain
  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="text-6xl">🚧</div>
            <h1 className="text-3xl font-bold text-foreground">{MAINTENANCE_CONFIG.title}</h1>
            <p className="text-muted-foreground text-lg">
              {MAINTENANCE_CONFIG.description}
            </p>
          </div>

          <div className="space-y-4 p-6 bg-card border rounded-lg">
            <h2 className="text-xl font-semibold">Coming Soon</h2>
            <ul className="text-left space-y-2 text-muted-foreground">
              {MAINTENANCE_CONFIG.features.map((feature, index) => (
                <li key={index}>• {feature}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Want to be notified when we launch?
            </p>
            <a 
              href={`mailto:${MAINTENANCE_CONFIG.contactEmail}?subject=Notify me when ${MAINTENANCE_CONFIG.companyName} launches`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
            >
              📧 Get Launch Updates
            </a>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>© 2024 {MAINTENANCE_CONFIG.companyName}. All rights reserved.</p>
          </div>
        </div>
      </div>
    )
  }

  // Show normal app for all other domains
  return <>{children}</>
}