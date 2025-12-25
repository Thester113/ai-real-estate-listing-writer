'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/utils'
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Shield,
  Download,
  RefreshCw,
  Crown,
  AlertTriangle
} from 'lucide-react'

interface User {
  id: string
  email?: string
  role?: string
}

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalGenerations: number
  totalRevenue: number
  proSubscribers: number
  starterUsers: number
}

interface Generation {
  id: string
  created_at: string
  user_id: string
  word_count: number
  result: any
  metadata: any
  profile: {
    email: string
    full_name: string
    plan: string
  }
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth?redirect=/admin')
        return
      }

      // Check if user has admin role or is specific admin email
      const adminEmails = ['tom@hester.com', 'admin@airealestatelistings.com']
      const isAdmin = adminEmails.includes(session.user.email || '')

      if (!isAdmin) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin access',
          variant: 'destructive'
        })
        router.push('/dashboard')
        return
      }

      setUser(session.user)
      await loadAdminData()

    } catch (error) {
      console.error('Admin access error:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const loadAdminData = async () => {
    try {
      // Load stats
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: totalGenerations },
        { count: proSubscribers },
        { count: starterUsers }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_sign_in_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('generations').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'starter')
      ])

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalGenerations: totalGenerations || 0,
        totalRevenue: (proSubscribers || 0) * 29, // Simplified calculation
        proSubscribers: proSubscribers || 0,
        starterUsers: starterUsers || 0
      })

      // Load recent generations
      const { data: generations, error: generationsError } = await supabase
        .from('generations')
        .select(`
          *,
          profile:profiles(email, full_name, plan)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (generationsError) throw generationsError
      setRecentGenerations(generations || [])

    } catch (error) {
      console.error('Error loading admin data:', error)
      toast({
        title: 'Error loading admin data',
        description: getErrorMessage(error),
        variant: 'destructive'
      })
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadAdminData()
    setRefreshing(false)
    toast({
      title: 'Data refreshed',
      description: 'Admin dashboard data has been updated'
    })
  }

  const exportData = async (type: 'users' | 'generations') => {
    try {
      let data
      let filename
      
      if (type === 'users') {
        const { data: users, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        data = users
        filename = 'users-export.json'
      } else {
        const { data: generations, error } = await supabase
          .from('generations')
          .select(`*, profile:profiles(email, full_name, plan)`)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        data = generations
        filename = 'generations-export.json'
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: 'Export complete',
        description: `${type} data has been exported`
      })

    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: getErrorMessage(error),
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="h-6 w-6 text-red-600" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={refreshData} variant="outline" size="sm" disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <span className="text-sm text-muted-foreground">
                Welcome, {user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800 text-sm font-medium">
              You are accessing sensitive administrative data. Handle with care and follow data protection policies.
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card border rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-card border rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active (30d)</p>
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-card border rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Generations</p>
                  <p className="text-2xl font-bold">{stats.totalGenerations}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-card border rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">MRR (Est.)</p>
                  <p className="text-2xl font-bold">${stats.totalRevenue}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        )}

        {/* Plan Distribution */}
        {stats && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Plan Distribution</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Crown className="h-4 w-4 text-yellow-600 mr-2" />
                    <span>Pro Subscribers</span>
                  </div>
                  <span className="font-bold">{stats.proSubscribers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="ml-6">Starter Users</span>
                  <span className="font-bold">{stats.starterUsers}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button onClick={() => exportData('users')} variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export User Data
                </Button>
                <Button onClick={() => exportData('generations')} variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Generations
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-card border rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Generations</h2>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {recentGenerations.length > 0 ? (
              recentGenerations.map((generation) => (
                <div key={generation.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{generation.profile?.email || 'Unknown'}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          generation.profile?.plan === 'pro' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {generation.profile?.plan === 'pro' ? 'Pro' : 'Starter'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {generation.result?.title || 'No title'}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{generation.word_count} words</span>
                        <span>•</span>
                        <span>{new Date(generation.created_at).toLocaleString()}</span>
                        <span>•</span>
                        <span>{generation.metadata?.model || 'Unknown model'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                No recent generations found
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}