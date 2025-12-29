'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Footer } from '@/components/footer'
import { CheckCircle, XCircle, Loader2, Server, Database, CreditCard, Bot } from 'lucide-react'

type HealthStatus = {
  status: string
  timestamp: string
  version: string
  environment: string
  services: {
    database: string
    stripe: string
    openai: string
  }
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health')
        if (!res.ok) throw new Error('Failed to fetch health status')
        const data = await res.json()
        setHealth(data)
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchHealth()
  }, [])

  const getStatusColor = (status: string) => {
    return status === 'connected' || status === 'configured' || status === 'ok'
      ? 'text-green-500'
      : 'text-red-500'
  }

  const getStatusIcon = (status: string) => {
    return status === 'connected' || status === 'configured' || status === 'ok'
      ? <CheckCircle className="h-5 w-5 text-green-500" />
      : <XCircle className="h-5 w-5 text-red-500" />
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <Image
            src="/logo.svg"
            alt="AI Property Writer"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="ml-2 font-bold text-lg">AI Property Writer</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/pricing">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/blog">
            Blog
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/auth">
            Sign In
          </Link>
        </nav>
      </header>

      <main className="flex-1 bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12 md:py-24">
        <div className="container px-4 md:px-6 mx-auto max-w-3xl">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">System Status</h1>
              <p className="text-muted-foreground">
                Current operational status of AI Property Writer services
              </p>
            </div>

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
                <span className="font-semibold">Overall System Status</span>
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </div>
                ) : error ? (
                   <div className="flex items-center gap-2 text-red-500">
                    <XCircle className="h-5 w-5" />
                    System Issues
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="h-5 w-5" />
                    All Systems Operational
                  </div>
                )}
              </div>

              <div className="divide-y">
                {/* Database */}
                <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Database</h3>
                      <p className="text-sm text-muted-foreground">Core data storage and retrieval</p>
                    </div>
                  </div>
                  {loading ? (
                    <div className="h-2 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm capitalize ${health ? getStatusColor(health.services.database) : ''}`}>
                        {health?.services?.database || 'Unknown'}
                      </span>
                      {getStatusIcon(health?.services?.database || 'error')}
                    </div>
                  )}
                </div>

                {/* AI Engine */}
                <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">AI Engine</h3>
                      <p className="text-sm text-muted-foreground">OpenAI generation services</p>
                    </div>
                  </div>
                  {loading ? (
                    <div className="h-2 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm capitalize ${health ? getStatusColor(health.services.openai) : ''}`}>
                         {health?.services?.openai === 'configured' ? 'Operational' : health?.services?.openai || 'Unknown'}
                      </span>
                      {getStatusIcon(health?.services?.openai || 'error')}
                    </div>
                  )}
                </div>

                {/* Payments */}
                <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Payments</h3>
                      <p className="text-sm text-muted-foreground">Stripe payment processing</p>
                    </div>
                  </div>
                  {loading ? (
                    <div className="h-2 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm capitalize ${health ? getStatusColor(health.services.stripe) : ''}`}>
                        {health?.services?.stripe === 'configured' ? 'Operational' : health?.services?.stripe || 'Unknown'}
                      </span>
                      {getStatusIcon(health?.services?.stripe || 'error')}
                    </div>
                  )}
                </div>

                {/* API Gateway */}
                <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Server className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">API Gateway</h3>
                      <p className="text-sm text-muted-foreground">Main application endpoints</p>
                    </div>
                  </div>
                  {loading ? (
                    <div className="h-2 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm capitalize ${health ? getStatusColor('ok') : ''}`}>
                        Operational
                      </span>
                      {getStatusIcon('ok')}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-muted/30 text-xs text-center text-muted-foreground">
                Last updated: {loading ? '...' : new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
