'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface EmailCaptureProps {
  variant?: 'default' | 'hero' | 'sidebar'
  title?: string
  description?: string
  placeholder?: string
  buttonText?: string
  tags?: string[]
  className?: string
}

export function EmailCapture({
  variant = 'default',
  title = "Get Real Estate Listing Tips",
  description = "Join 1,000+ agents getting weekly tips on writing better property descriptions",
  placeholder = "Enter your email address",
  buttonText = "Get Free Tips",
  tags = [],
  className = ""
}: EmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<'kit_email' | 'direct_download' | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/convertkit/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          tags: [...tags, `Lead Magnet - ${variant}`],
          firstName: '', // We'll get this later
          plan: 'starter'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to subscribe')
      }

      setIsSubscribed(true)

      // Handle different delivery methods
      if (result.deliveryMethod === 'kit_email') {
        // Kit will send the PDF via incentive email
        setDeliveryMethod('kit_email')
        toast({
          title: 'Check your inbox!',
          description: 'Your download link is on its way to your email.',
        })
      } else if (result.downloadUrl) {
        setDeliveryMethod('direct_download')
        // Direct download
        setDownloadUrl(result.downloadUrl)

        // Auto-trigger download after a short delay
        setTimeout(() => {
          window.location.href = result.downloadUrl
        }, 500)

        toast({
          title: 'Successfully subscribed!',
          description: 'Your download will start automatically.',
        })
      } else {
        toast({
          title: 'Successfully subscribed!',
          description: 'Check your email for your first tip.',
        })
      }
    } catch (error) {
      console.error('Email capture error:', error)
      toast({
        title: 'Subscription failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubscribed) {
    return (
      <div className={`text-center p-6 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="text-4xl mb-2">✅</div>
        <h3 className="text-lg font-semibold text-green-800 mb-1">You're subscribed!</h3>
        {deliveryMethod === 'kit_email' ? (
          <>
            <p className="text-green-700 text-sm mb-2">Check your inbox for your download link.</p>
            <p className="text-green-600 text-xs">Don't see it? Check your spam folder.</p>
          </>
        ) : downloadUrl ? (
          <>
            <p className="text-green-700 text-sm mb-4">Your download will start automatically.</p>
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Now
            </a>
          </>
        ) : (
          <p className="text-green-700 text-sm">Check your email for your first real estate tip.</p>
        )}
      </div>
    )
  }

  const heroStyle = variant === 'hero'
  const sidebarStyle = variant === 'sidebar'

  return (
    <div className={`${className} ${
      heroStyle ? 'text-center max-w-md mx-auto' :
      sidebarStyle ? 'bg-muted/50 p-4 rounded-lg border' :
      'bg-card p-6 rounded-lg border'
    }`}>
      <div className={heroStyle ? 'mb-6' : 'mb-4'}>
        <h3 className={`font-semibold ${
          heroStyle ? 'text-xl mb-2' :
          sidebarStyle ? 'text-base mb-1' :
          'text-lg mb-2'
        }`}>
          {title}
        </h3>
        <p className={`text-muted-foreground ${
          heroStyle ? 'text-base' :
          sidebarStyle ? 'text-xs' :
          'text-sm'
        }`}>
          {description}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className={sidebarStyle ? 'text-sm' : ''}
        />
        <Button
          type="submit"
          disabled={isLoading || !email}
          className={`w-full ${sidebarStyle ? 'text-sm py-2' : ''}`}
        >
          {isLoading ? 'Subscribing...' : buttonText}
        </Button>
      </form>
      
      {!sidebarStyle && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          No spam. Unsubscribe anytime.
        </p>
      )}
    </div>
  )
}