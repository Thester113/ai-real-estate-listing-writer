'use client'

import { Button } from '@/components/ui/button'
import { Construction, Mail } from 'lucide-react'
import Link from 'next/link'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <Construction className="h-16 w-16 mx-auto text-primary animate-pulse" />
          <h1 className="text-3xl font-bold">We're Getting Ready!</h1>
          <p className="text-muted-foreground text-lg">
            PropertyWriter is currently in development. We're putting the finishing touches on our AI-powered real estate listing generator.
          </p>
        </div>

        <div className="space-y-4 p-6 bg-card border rounded-lg">
          <h2 className="text-xl font-semibold">Coming Soon</h2>
          <ul className="text-left space-y-2 text-muted-foreground">
            <li>• AI-generated property listings</li>
            <li>• Professional copywriting templates</li>
            <li>• Multiple export formats</li>
            <li>• Advanced targeting options</li>
          </ul>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Want to be notified when we launch?
          </p>
          <Button asChild className="w-full">
            <Link href="mailto:contact@aipropertywriter.com?subject=Notify me when PropertyWriter launches">
              <Mail className="h-4 w-4 mr-2" />
              Get Launch Updates
            </Link>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>© 2024 PropertyWriter. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}