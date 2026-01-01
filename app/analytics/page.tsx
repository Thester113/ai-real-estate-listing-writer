'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, BarChart3, TrendingUp, FileText, Calendar, Download } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email?: string
}

interface AnalyticsData {
  totalListings: number
  totalWords: number
  averageWordsPerListing: number
  dailyUsage: { date: string; listings: number; words: number }[]
  topPropertyTypes: { type: string; count: number }[]
  monthlyTrends: { month: string; listings: number }[]
  listingPerformance: { 
    id: string
    title: string
    created_at: string
    word_count: number
    metadata: any
  }[]
}

export default function AnalyticsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [userPlan, setUserPlan] = useState<string>('starter')
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user && userPlan === 'pro') {
      loadAnalytics()
    }
  }, [user, userPlan, dateRange])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth?redirect=/analytics')
        return
      }

      setUser(session.user)
      
      // Get user profile to check plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single()
      
      const userPlanValue = (profile as any)?.plan || 'starter'
      
      if (userPlanValue !== 'pro') {
        router.push('/dashboard?upgrade=true')
        return
      }
      
      setUserPlan(userPlanValue)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    if (!user) return

    try {
      const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)

      // Get generations data
      const { data: generations, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process analytics data
      const totalListings = generations?.length || 0
      const totalWords = generations?.reduce((sum, gen) => sum + ((gen as any).word_count || 0), 0) || 0
      const averageWordsPerListing = totalListings > 0 ? Math.round(totalWords / totalListings) : 0

      // Group by date for daily usage
      const dailyUsage = groupByDate(generations || [])
      
      // Group by property type (extract from result title or metadata)
      const topPropertyTypes = groupByPropertyType(generations || [])
      
      // Group by month for trends
      const monthlyTrends = groupByMonth(generations || [])

      setAnalytics({
        totalListings,
        totalWords,
        averageWordsPerListing,
        dailyUsage,
        topPropertyTypes,
        monthlyTrends,
        listingPerformance: (generations || []).slice(0, 10)
      })

    } catch (error) {
      console.error('Analytics error:', error)
      toast({
        title: 'Error loading analytics',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      })
    }
  }

  const groupByDate = (generations: any[]) => {
    const grouped = generations.reduce((acc, gen) => {
      const date = new Date(gen.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { listings: 0, words: 0 }
      }
      acc[date].listings += 1
      acc[date].words += (gen as any).word_count || 0
      return acc
    }, {} as Record<string, { listings: number; words: number }>)

    return Object.entries(grouped).map(([date, data]) => {
      const typedData = data as { listings: number; words: number }
      return {
        date,
        listings: typedData.listings,
        words: typedData.words
      }
    }).sort((a, b) => a.date.localeCompare(b.date))
  }

  const groupByPropertyType = (generations: any[]) => {
    const grouped = generations.reduce((acc, gen) => {
      // Extract property type from title or metadata
      const title = (gen as any).result?.title || ''
      let type = 'Unknown'
      
      if (title.includes('Single Family') || title.includes('House')) type = 'Single Family'
      else if (title.includes('Condo') || title.includes('Apartment')) type = 'Condo'
      else if (title.includes('Townhouse')) type = 'Townhouse'
      else if (title.includes('Multi')) type = 'Multi-Family'
      else if (title.includes('Land') || title.includes('Lot')) type = 'Land'
      
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped)
      .map(([type, count]) => ({ type, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  const groupByMonth = (generations: any[]) => {
    const grouped = generations.reduce((acc, gen) => {
      const month = new Date(gen.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped).map(([month, listings]) => ({
      month,
      listings: listings as number
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }

  const exportAnalytics = () => {
    if (!analytics) return

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Listings', analytics.totalListings.toString()],
      ['Total Words', analytics.totalWords.toString()],
      ['Average Words per Listing', analytics.averageWordsPerListing.toString()],
      [''],
      ['Date', 'Listings', 'Words'],
      ...analytics.dailyUsage.map(item => [item.date, item.listings.toString(), item.words.toString()]),
      [''],
      ['Property Type', 'Count'],
      ...analytics.topPropertyTypes.map(item => [item.type, item.count.toString()])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold">Analytics Dashboard</h1>
              <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">Pro Only</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-background border rounded-lg">
                <Button 
                  variant={dateRange === '7d' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDateRange('7d')}
                >
                  7 days
                </Button>
                <Button 
                  variant={dateRange === '30d' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDateRange('30d')}
                >
                  30 days
                </Button>
                <Button 
                  variant={dateRange === '90d' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDateRange('90d')}
                >
                  90 days
                </Button>
              </div>
              <Button onClick={exportAnalytics} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {analytics && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-card border rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Total Listings</h3>
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary">{analytics.totalListings}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Last {dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '90'} days
                </p>
              </div>

              <div className="bg-card border rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Total Words</h3>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary">{analytics.totalWords.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Avg {analytics.averageWordsPerListing} per listing
                </p>
              </div>

              <div className="bg-card border rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Daily Average</h3>
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary">
                  {Math.round(analytics.totalListings / (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Listings per day
                </p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Daily Usage Chart */}
              <div className="bg-card border rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Daily Usage</h3>
                <div className="space-y-3">
                  {analytics.dailyUsage.slice(-7).map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${(day.listings / Math.max(...analytics.dailyUsage.map(d => d.listings))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{day.listings}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Property Types */}
              <div className="bg-card border rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Top Property Types</h3>
                <div className="space-y-3">
                  {analytics.topPropertyTypes.map((type, index) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <span className="text-sm">{type.type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(type.count / Math.max(...analytics.topPropertyTypes.map(t => t.count))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{type.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Performance */}
            <div className="bg-card border rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Recent Listing Performance</h3>
              </div>
              <div className="divide-y">
                {analytics.listingPerformance.map((listing) => (
                  <div key={listing.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">
                          {(listing as any).result?.title || listing.title || 'Untitled Listing'}
                        </h4>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{listing.word_count} words</span>
                          <span>•</span>
                          <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{listing.metadata?.model || 'AI Generated'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Math.round((listing.word_count / analytics.averageWordsPerListing - 1) * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          vs avg
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!analytics && (
          <div className="bg-card border rounded-lg shadow-sm p-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground">
              Generate some listings to see your analytics dashboard
            </p>
          </div>
        )}
      </div>
    </div>
  )
}