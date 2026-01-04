'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase, getProfile } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/utils'
import { ArrowLeft, Mail, User, CreditCard, Crown, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
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

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)

  const [fullName, setFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth')
        return
      }

      const profileData = await getProfile(session.user.id)
      setProfile(profileData)
      setFullName(profileData.full_name || '')
    } catch (error) {
      console.error('Error loading profile:', error)
      toast({
        title: 'Error loading profile',
        description: getErrorMessage(error),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateName = async () => {
    if (!profile) return

    setSavingName(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: 'Authentication Error',
          description: 'Please sign in again.',
          variant: 'destructive'
        })
        router.push('/auth')
        return
      }

      const response = await fetch('/api/account/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ full_name: fullName.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setProfile(prev => prev ? { ...prev, full_name: fullName.trim() } : null)

      toast({
        title: 'Profile updated',
        description: 'Your name has been updated successfully.'
      })
    } catch (error) {
      console.error('Update name error:', error)
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive'
      })
    } finally {
      setSavingName(false)
    }
  }

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) return

    setSavingEmail(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: 'Authentication Error',
          description: 'Please sign in again.',
          variant: 'destructive'
        })
        router.push('/auth')
        return
      }

      const response = await fetch('/api/account/update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ email: newEmail.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email')
      }

      setPendingEmail(data.pendingEmail)
      setShowEmailForm(false)
      setNewEmail('')

      toast({
        title: 'Confirmation email sent',
        description: `Please check ${data.pendingEmail} and click the confirmation link.`
      })
    } catch (error) {
      console.error('Update email error:', error)
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive'
      })
    } finally {
      setSavingEmail(false)
    }
  }

  const handleManageBilling = async () => {
    setBillingLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: 'Authentication Error',
          description: 'Please sign in again.',
          variant: 'destructive'
        })
        router.push('/auth')
        return
      }

      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard/settings`
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
      setBillingLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950'
      case 'past_due':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950'
      case 'canceled':
      case 'unpaid':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950'
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900'
    }
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and subscription</p>
        </div>

        {/* Profile Section */}
        <div className="bg-card border rounded-lg shadow-sm mb-6">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Profile</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="flex gap-3">
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="max-w-sm"
                />
                <Button
                  onClick={handleUpdateName}
                  disabled={savingName || fullName === profile.full_name}
                >
                  {savingName ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Email Section */}
        <div className="bg-card border rounded-lg shadow-sm mb-6">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Email Address</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{profile.email}</p>
                <p className="text-sm text-muted-foreground">Your current email address</p>
              </div>
              {!showEmailForm && !pendingEmail && (
                <Button variant="outline" onClick={() => setShowEmailForm(true)}>
                  Change Email
                </Button>
              )}
            </div>

            {/* Pending Email Notice */}
            {pendingEmail && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Confirmation pending</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    We sent a confirmation email to <strong>{pendingEmail}</strong>.
                    Please click the link in that email to complete the change.
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-yellow-700 dark:text-yellow-300"
                    onClick={() => setPendingEmail(null)}
                  >
                    Cancel email change
                  </Button>
                </div>
              </div>
            )}

            {/* Email Change Form */}
            {showEmailForm && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Label htmlFor="newEmail">New Email Address</Label>
                <div className="flex gap-3">
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                    className="max-w-sm"
                  />
                  <Button
                    onClick={handleUpdateEmail}
                    disabled={savingEmail || !newEmail.trim()}
                  >
                    {savingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Confirmation'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowEmailForm(false)
                      setNewEmail('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  We'll send a confirmation link to your new email address.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-card border rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Subscription</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Current Plan */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-lg">
                    {profile.plan === 'pro' ? 'Pro Plan' : 'Starter Plan'}
                  </span>
                  {profile.plan === 'pro' && (
                    <Crown className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {profile.plan === 'pro' ? '500 listings/month' : '20 listings/month'}
                </p>
              </div>
              {profile.plan === 'starter' && (
                <Link href="/pricing">
                  <Button>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </Link>
              )}
            </div>

            {/* Subscription Status (for Pro users) */}
            {profile.plan === 'pro' && profile.subscription_status && (
              <>
                <div className="border-t pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(profile.subscription_status)}`}>
                        {profile.subscription_status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {profile.subscription_status}
                      </span>
                    </div>
                    {profile.current_period_end && (
                      <div>
                        <p className="text-sm text-muted-foreground">Next billing date</p>
                        <p className="font-medium">{formatDate(profile.current_period_end)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={billingLoading}
                  >
                    {billingLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Manage Billing'
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Update payment method, view invoices, or cancel subscription
                  </p>
                </div>
              </>
            )}

            {/* Starter plan with no subscription */}
            {profile.plan === 'starter' && !profile.subscription_id && (
              <div className="border-t pt-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    You're on the free Starter plan. Upgrade to Pro for more listings,
                    advanced features, and priority support.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
