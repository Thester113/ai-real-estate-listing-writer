'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/utils'
import { Check, Crown, Zap, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email?: string
}

interface Profile {
  id: string
  plan: 'starter' | 'pro'
  subscription_status: string
}

const plans = [
  {
    name: 'Starter',
    id: 'starter',
    price: 0,
    period: 'month',
    description: 'Perfect for getting started with AI-generated listings',
    features: [
      '20 listings per month',
      'Basic AI copywriting',
      'Standard templates',
      'Email support',
      'Basic analytics'
    ],
    limitations: [
      'Limited to 20 listings/month',
      'Basic AI model only',
      'No priority support'
    ],
    cta: 'Current Plan',
    popular: false
  },
  {
    name: 'Pro',
    id: 'pro', 
    price: 29,
    period: 'month',
    description: 'For professionals who need more power and flexibility',
    features: [
      '500 listings per month',
      'Advanced AI copywriting',
      'Premium templates',
      'Priority support',
      'Advanced analytics',
      'Custom target audiences',
      'A/B testing insights',
      'Export to multiple formats'
    ],
    limitations: [],
    cta: 'Upgrade to Pro',
    popular: true
  }
]

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setUser(session.user)
        
        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) throw profileError
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      router.push('/auth?redirect=/pricing')
      return
    }

    if (planId === 'starter') {
      return // Can't "upgrade" to starter
    }

    // Safety check - disable payments if flag is set
    if (process.env.NEXT_PUBLIC_DISABLE_PAYMENTS === '1') {
      toast({
        title: 'Payments Temporarily Disabled',
        description: 'Upgrade functionality is currently disabled. Please try again later.',
        variant: 'destructive'
      })
      return
    }

    setUpgrading(true)

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          planId,
          successUrl: `${window.location.origin}/dashboard?upgraded=true`,
          cancelUrl: `${window.location.origin}/pricing`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url

    } catch (error) {
      console.error('Upgrade error:', error)
      toast({
        title: 'Upgrade failed',
        description: getErrorMessage(error),
        variant: 'destructive'
      })
    } finally {
      setUpgrading(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to access billing portal')
      }

      window.location.href = data.url

    } catch (error) {
      console.error('Billing portal error:', error)
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive'
      })
    }
  }

  const getUserPlan = () => {
    return profile?.plan || 'starter'
  }

  const isCurrentPlan = (planId: string) => {
    return getUserPlan() === planId
  }

  const getPlanButton = (plan: any) => {
    const currentPlan = getUserPlan()
    
    if (plan.id === 'starter') {
      if (currentPlan === 'starter') {
        return { text: 'Current Plan', disabled: true, variant: 'secondary' as const }
      } else {
        return { text: 'Downgrade', disabled: true, variant: 'outline' as const }
      }
    }
    
    if (plan.id === 'pro') {
      if (currentPlan === 'pro') {
        return { text: 'Current Plan', disabled: true, variant: 'secondary' as const }
      } else {
        return { text: 'Upgrade to Pro', disabled: false, variant: 'default' as const }
      }
    }
    
    return { text: plan.cta, disabled: false, variant: 'default' as const }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              PropertyWriter
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button asChild variant="outline">
                    <Link href="/dashboard">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Link>
                  </Button>
                  {profile?.plan === 'pro' && (
                    <Button variant="outline" onClick={handleManageBilling}>
                      Manage Billing
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link href="/auth">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Get started for free, upgrade when you need more power
          </p>
          
          {user && profile && (
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-8">
              Currently on {profile.plan === 'pro' ? 'Pro' : 'Starter'} Plan
            </div>
          )}
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => {
              const buttonConfig = getPlanButton(plan)
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-card border rounded-2xl shadow-lg p-8 ${
                    plan.popular ? 'border-primary shadow-primary/20' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                        <Crown className="h-3 w-3 mr-1" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={buttonConfig.variant}
                    className="w-full"
                    disabled={buttonConfig.disabled || upgrading}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {upgrading && plan.id === 'pro' ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        {plan.id === 'pro' && <Zap className="h-4 w-4 mr-2" />}
                        {buttonConfig.text}
                      </>
                    )}
                  </Button>

                  {isCurrentPlan(plan.id) && profile?.subscription_status && (
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      Status: {profile.subscription_status.charAt(0).toUpperCase() + profile.subscription_status.slice(1)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-semibold mb-3">Can I change my plan anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.
              </p>
            </div>
            
            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-semibold mb-3">What happens if I exceed my limits?</h3>
              <p className="text-muted-foreground">
                You'll be notified when you're approaching your limits. Once reached, you'll need to upgrade or wait until your next billing cycle.
              </p>
            </div>
            
            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-semibold mb-3">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                The Starter plan is completely free forever with 20 listings per month. No credit card required to get started.
              </p>
            </div>
            
            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-semibold mb-3">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">
                Absolutely. You can cancel your subscription anytime from the billing portal. You'll continue to have access until your current period ends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to generate amazing listings?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of real estate professionals who trust AI Listings
          </p>
          {!user && (
            <Button asChild size="lg">
              <Link href="/auth">
                Get Started Free
                <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
              </Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}