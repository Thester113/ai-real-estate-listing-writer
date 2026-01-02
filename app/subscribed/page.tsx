'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function SubscribedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
          <h1 className="text-3xl font-bold">You're In!</h1>
          <p className="text-muted-foreground text-lg">
            Thanks for confirming your subscription to AI Property Writer.
          </p>
        </div>

        <div className="space-y-4 p-6 bg-card border rounded-lg">
          <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            What's Next
          </h2>
          <ul className="text-left space-y-2 text-muted-foreground">
            <li>• Check your inbox for our welcome email</li>
            <li>• Get weekly tips on listings that sell faster</li>
            <li>• Access subscriber-only resources and guides</li>
            <li>• Be the first to know about new features</li>
          </ul>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ready to create your first AI-powered listing?
          </p>
          <Button asChild className="w-full">
            <Link href="/generate">
              Try AI Property Writer Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} AI Property Writer. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
