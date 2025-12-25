'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/utils'
import { ArrowLeft, FileText, Copy, Download, Eye } from 'lucide-react'
import Link from 'next/link'

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

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadGenerations()
  }, [])

  const loadGenerations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth?redirect=/history')
        return
      }

      const { data: generationsData, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setGenerations(generationsData || [])

    } catch (error) {
      console.error('History error:', error)
      toast({
        title: 'Error loading history',
        description: getErrorMessage(error),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: 'Copied!',
        description: 'Text copied to clipboard'
      })
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive'
      })
    }
  }

  const exportAsText = (generation: Generation) => {
    const result = generation.result
    const text = `${result.title}

${result.description}

Key Features:
${result.highlights.map(h => `• ${h}`).join('\n')}

Marketing Points:
${result.marketingPoints.map(p => `• ${p}`).join('\n')}

${result.callToAction}`

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `listing-${new Date(generation.created_at).toISOString().split('T')[0]}.txt`
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
              <h1 className="text-xl font-bold">Generation History</h1>
            </div>
            <Button asChild>
              <Link href="/generate">Generate New Listing</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {generations.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* List */}
            <div className="space-y-4">
              {generations.map((generation) => (
                <div
                  key={generation.id}
                  className={`bg-card border rounded-lg shadow-sm p-4 cursor-pointer transition-colors ${
                    selectedGeneration?.id === generation.id ? 'border-primary' : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setSelectedGeneration(generation)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-lg line-clamp-2">
                      {generation.result.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedGeneration(generation)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                    {generation.result.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <span>{generation.word_count} words</span>
                      <span>•</span>
                      <span className="capitalize">{generation.metadata.plan} plan</span>
                    </div>
                    <span>{new Date(generation.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail View */}
            <div className="space-y-6">
              {selectedGeneration ? (
                <div className="bg-card border rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Listing Details</h2>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(`${selectedGeneration.result.title}\n\n${selectedGeneration.result.description}`)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportAsText(selectedGeneration)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <div className="p-3 bg-secondary rounded-md">
                        <p className="font-medium">{selectedGeneration.result.title}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <div className="p-3 bg-secondary rounded-md">
                        <p className="whitespace-pre-wrap">{selectedGeneration.result.description}</p>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Key Highlights</label>
                      <div className="p-3 bg-secondary rounded-md">
                        <ul className="list-disc list-inside space-y-1">
                          {selectedGeneration.result.highlights.map((highlight, index) => (
                            <li key={index} className="text-sm">{highlight}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Marketing Points */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Marketing Points</label>
                      <div className="p-3 bg-secondary rounded-md">
                        <ul className="list-disc list-inside space-y-1">
                          {selectedGeneration.result.marketingPoints.map((point, index) => (
                            <li key={index} className="text-sm">{point}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Call to Action */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Call to Action</label>
                      <div className="p-3 bg-secondary rounded-md">
                        <p className="font-medium text-primary">{selectedGeneration.result.callToAction}</p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium mb-2">Generation Info</label>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Date:</span> {new Date(selectedGeneration.created_at).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Words:</span> {selectedGeneration.word_count}
                        </div>
                        <div>
                          <span className="font-medium">Model:</span> {selectedGeneration.metadata.model}
                        </div>
                        <div>
                          <span className="font-medium">Tokens:</span> {selectedGeneration.metadata.tokens_used}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card border rounded-lg shadow-sm p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Listing</h3>
                  <p className="text-muted-foreground">
                    Click on any listing from the left to view its details.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card border rounded-lg shadow-sm p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Listings Yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't generated any listings yet. Create your first AI-powered listing to get started!
            </p>
            <Button asChild>
              <Link href="/generate">Generate Your First Listing</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}