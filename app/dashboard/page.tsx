'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase, getProfile, getUserUsage } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/utils'
import { Plus, FileText, TrendingUp, Crown, Zap, Upload, BarChart3, Palette, Target, Settings, Sparkles, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

interface Profile {
  id: string
  full_name: string
  email: string
  plan: 'starter' | 'pro'
  subscription_status: string
  subscription_id: string
  customer_id: string
  current_period_end: string
}

interface Usage {
  listings_generated: number
  words_generated: number
  reset_date: string
}

interface Generation {
  id: string
  created_at: string
  result: {
    title: string
    description: string
    highlights: string[]
    marketingPoints: string[]
    callToAction: string
  }
  word_count: number
  metadata: {
    model: string
    tokens_used: number
    plan: string
  }
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [isBillingLoading, setIsBillingLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth')
        return
      }

      // Load profile
      const profileData = await getProfile(session.user.id)
      setProfile(profileData)

      // Load usage
      const usageData = await getUserUsage(session.user.id)
      setUsage(usageData)

      // Load recent generations
      const { data: generationsData, error: generationsError } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (generationsError) throw generationsError
      setGenerations(generationsData || [])

    } catch (error) {
      console.error('Dashboard error:', error)
      toast({
        title: 'Error loading dashboard',
        description: getErrorMessage(error),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleManageBilling = async () => {
    setIsBillingLoading(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        toast({
          title: 'Authentication Error',
          description: 'Please sign in again to manage your billing.',
          variant: 'destructive'
        })
        router.push('/auth?redirect=/dashboard')
        return
      }

      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
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
    } finally {
      setIsBillingLoading(false)
    }
  }

  const getLimitForPlan = (plan: 'starter' | 'pro') => {
    return plan === 'starter' ? 20 : 500
  }

  const getRemainingGenerations = () => {
    if (!profile || !usage) return 0
    const limit = getLimitForPlan(profile.plan)
    return Math.max(0, limit - usage.listings_generated)
  }

  const getUsagePercentage = () => {
    if (!profile || !usage) return 0
    const limit = getLimitForPlan(profile.plan)
    return Math.min(100, (usage.listings_generated / limit) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="AI Property Writer"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="text-xl font-bold">AI Property Writer</span>
              </Link>
              <div className="flex items-center space-x-2">
                {profile.plan === 'pro' ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Crown className="h-3 w-3 mr-1" />
                    Pro Plan
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Starter Plan
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome back, {profile.full_name}!
              </span>

              <ThemeToggle />

              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {profile.customer_id && (
                    <DropdownMenuItem
                      onClick={handleManageBilling}
                      disabled={isBillingLoading}
                    >
                      {isBillingLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        'Manage Billing'
                      )}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner for New Users */}
        {generations.length === 0 && (
          <div className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 border border-primary/20 rounded-xl p-8">
            <div className="flex items-start gap-6">
              <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Welcome to AI PropertyWriter!</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl">
                  You're all set up and ready to create professional real estate listings in seconds.
                  Here's how to get started:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-start gap-3 bg-background/60 rounded-lg p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</div>
                    <div>
                      <h3 className="font-semibold text-sm">Enter property details</h3>
                      <p className="text-xs text-muted-foreground">Bedrooms, location, features</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-background/60 rounded-lg p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">2</div>
                    <div>
                      <h3 className="font-semibold text-sm">AI generates your listing</h3>
                      <p className="text-xs text-muted-foreground">3 unique variations instantly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-background/60 rounded-lg p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">3</div>
                    <div>
                      <h3 className="font-semibold text-sm">Copy and use anywhere</h3>
                      <p className="text-xs text-muted-foreground">MLS, Zillow, social media</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <Link href="/generate">
                    <Button size="lg">
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Listing
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>20 free listings included</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Usage Card */}
          <div className="bg-card border rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Monthly Usage</h3>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Listings Generated</span>
                <span className="text-2xl font-bold">{usage?.listings_generated || 0}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getUsagePercentage()}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{getRemainingGenerations()} remaining</span>
                <span>{getLimitForPlan(profile.plan)} total</span>
              </div>

              {/* Usage warnings */}
              {getUsagePercentage() >= 80 && getRemainingGenerations() > 0 && (
                <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ You're approaching your monthly limit.
                  {profile.plan === 'starter' && (
                    <Link href="/pricing" className="font-medium underline ml-1">
                      Upgrade to Pro for 500 generations/month
                    </Link>
                  )}
                </div>
              )}

              {getRemainingGenerations() === 0 && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                  🚫 Monthly limit reached.
                  {profile.plan === 'starter' ? (
                    <Link href="/pricing" className="font-medium underline ml-1">
                      Upgrade to Pro for more generations
                    </Link>
                  ) : (
                    <span className="ml-1">Resets next month.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Words Generated */}
          <div className="bg-card border rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Words Generated</h3>
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary">
              {usage?.words_generated?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Total words this month
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              <Link href="/generate">
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  New Listing
                </Button>
              </Link>
              {profile.plan === 'pro' ? (
                <Link href="/generate/bulk">
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Generation
                  </Button>
                </Link>
              ) : (
                <Link href="/pricing">
                  <Button variant="outline" className="w-full">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Pro Features Section */}
        {profile.plan === 'pro' && (
          <div className="bg-card border rounded-lg shadow-sm mb-8">
            <div className="p-6 border-b">
              <div className="flex items-center">
                <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                <h2 className="text-xl font-semibold">Pro Features</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/generate" className="group">
                  <div className="p-4 rounded-lg border transition-all hover:shadow-md hover:border-primary/50">
                    <div className="flex items-center mb-2">
                      <Palette className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Advanced Styles</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Luxury, investment, family, and custom listing styles
                    </p>
                  </div>
                </Link>
                
                <Link href="/generate/bulk" className="group">
                  <div className="p-4 rounded-lg border transition-all hover:shadow-md hover:border-primary/50">
                    <div className="flex items-center mb-2">
                      <Upload className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Bulk Generation</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Generate multiple listings from CSV upload
                    </p>
                  </div>
                </Link>
                
                <Link href="/analytics" className="group">
                  <div className="p-4 rounded-lg border transition-all hover:shadow-md hover:border-primary/50">
                    <div className="flex items-center mb-2">
                      <BarChart3 className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Analytics</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Track performance and usage trends
                    </p>
                  </div>
                </Link>
                
                <div className="p-4 rounded-lg border opacity-50">
                  <div className="flex items-center mb-2">
                    <Target className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-medium">SEO Optimization</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Market analysis tools (Coming Soon)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Generations */}
        <div className="bg-card border rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Listings</h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/history">View All</Link>
              </Button>
            </div>
          </div>
          <div className="divide-y">
            {generations.length > 0 ? (
              generations.map((generation) => (
                <div key={generation.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-2">
                        {generation.result.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {generation.result.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{generation.word_count} words</span>
                        <span>•</span>
                        <span>{new Date(generation.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{generation.metadata.plan} plan</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/history?id=${generation.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No listings yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first AI-generated listing
                </p>
                <Button asChild>
                  <Link href="/generate">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Listing
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade CTA for Starter Plan */}
        {profile.plan === 'starter' && getUsagePercentage() > 80 && (
          <div className="mt-8 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  You're almost at your limit!
                </h3>
                <p className="text-muted-foreground">
                  Upgrade to Pro for 500 monthly generations, priority support, and advanced features.
                </p>
              </div>
              <Button asChild className="ml-6">
                <Link href="/pricing">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}