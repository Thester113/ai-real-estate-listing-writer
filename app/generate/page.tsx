'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/utils'
import { ArrowLeft, Wand2, Copy, Download, Share } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email?: string
}

interface ListingFormData {
  propertyType: string
  bedrooms: number
  bathrooms: number
  squareFeet: number | null
  features: string[]
  location: string
  targetAudience: string
  priceRange: {
    min: number
    max: number
  } | null
  additionalDetails: string
}

interface ListingResult {
  title: string
  description: string
  highlights: string[]
  marketingPoints: string[]
  callToAction: string
}

const propertyTypes = [
  'Single Family Home',
  'Condo/Apartment',
  'Townhouse',
  'Multi-Family',
  'Land/Lot',
  'Commercial',
  'Other'
]

const commonFeatures = [
  'Updated Kitchen',
  'Hardwood Floors',
  'Granite Countertops',
  'Stainless Steel Appliances',
  'Walk-in Closet',
  'Master Suite',
  'Fireplace',
  'Garage',
  'Basement',
  'Pool',
  'Deck/Patio',
  'Garden',
  'Home Office',
  'Laundry Room',
  'Storage Space',
  'Security System',
  'Central Air',
  'Energy Efficient',
  'New Construction',
  'Recently Renovated'
]

const targetAudiences = [
  'First-time homebuyers',
  'Growing families',
  'Empty nesters',
  'Young professionals',
  'Retirees',
  'Investors',
  'Luxury buyers',
  'Budget-conscious buyers'
]

export default function GeneratePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<ListingResult | null>(null)
  const [formData, setFormData] = useState<ListingFormData>({
    propertyType: '',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: null,
    features: [],
    location: '',
    targetAudience: '',
    priceRange: null,
    additionalDetails: ''
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth?redirect=/generate')
        return
      }

      setUser(session.user)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    // Validation
    if (!formData.propertyType || !formData.location || !formData.targetAudience || formData.features.length === 0) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    setGenerating(true)

    try {
      const response = await fetch('/api/generate/listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate listing')
      }

      setResult(data.data)
      toast({
        title: 'Listing generated!',
        description: `Created a ${data.meta.wordCount}-word listing with ${data.meta.tokensUsed} AI tokens`
      })

    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: 'Generation failed',
        description: getErrorMessage(error),
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
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

  const exportAsText = () => {
    if (!result) return
    
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
    a.download = `listing-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateNewListing = () => {
    setResult(null)
    setFormData({
      propertyType: '',
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: null,
      features: [],
      location: '',
      targetAudience: '',
      priceRange: null,
      additionalDetails: ''
    })
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
              <h1 className="text-xl font-bold">Generate Listing</h1>
            </div>
            {result && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(`${result.title}\n\n${result.description}`)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
                <Button variant="outline" size="sm" onClick={exportAsText}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            <div className="bg-card border rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-6">Property Details</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Property Type *
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => setFormData(prev => ({ ...prev, propertyType: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Select property type</option>
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Bedrooms & Bathrooms */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 0 }))}
                      min="0"
                      max="20"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 0 }))}
                      min="0"
                      max="20"
                      step="0.5"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* Square Feet */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Square Feet (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.squareFeet || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, squareFeet: parseInt(e.target.value) || null }))}
                    placeholder="e.g. 2500"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Downtown Seattle, WA"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Target Audience *
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Select target audience</option>
                    {targetAudiences.map(audience => (
                      <option key={audience} value={audience}>{audience}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Price Range (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={formData.priceRange?.min || ''}
                      onChange={(e) => {
                        const min = parseInt(e.target.value) || null
                        setFormData(prev => ({
                          ...prev,
                          priceRange: min ? { 
                            min,
                            max: prev.priceRange?.max || 0
                          } : null
                        }))
                      }}
                      placeholder="Min price"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      type="number"
                      value={formData.priceRange?.max || ''}
                      onChange={(e) => {
                        const max = parseInt(e.target.value) || null
                        setFormData(prev => ({
                          ...prev,
                          priceRange: max ? { 
                            min: prev.priceRange?.min || 0,
                            max
                          } : null
                        }))
                      }}
                      placeholder="Max price"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Key Features * (select at least one)
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-input rounded-md p-3">
                    {commonFeatures.map(feature => (
                      <label key={feature} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.features.includes(feature)}
                          onChange={() => handleFeatureToggle(feature)}
                          className="mr-2"
                        />
                        <span className="text-sm">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Details */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional Details (optional)
                  </label>
                  <textarea
                    value={formData.additionalDetails}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalDetails: e.target.value }))}
                    placeholder="Any special features, recent updates, neighborhood highlights..."
                    rows={3}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={generating}
                  className="w-full"
                  size="lg"
                >
                  {generating ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Listing
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Result */}
          <div className="space-y-6">
            {result ? (
              <div className="bg-card border rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Generated Listing</h2>
                  <Button onClick={generateNewListing} variant="outline" size="sm">
                    Generate New
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <div className="p-3 bg-secondary rounded-md relative group">
                      <p className="font-medium">{result.title}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(result.title)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <div className="p-3 bg-secondary rounded-md relative group">
                      <p className="whitespace-pre-wrap">{result.description}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(result.description)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Key Highlights</label>
                    <div className="p-3 bg-secondary rounded-md relative group">
                      <ul className="list-disc list-inside space-y-1">
                        {result.highlights.map((highlight, index) => (
                          <li key={index} className="text-sm">{highlight}</li>
                        ))}
                      </ul>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(result.highlights.join('\n• '))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Marketing Points */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Marketing Points</label>
                    <div className="p-3 bg-secondary rounded-md relative group">
                      <ul className="list-disc list-inside space-y-1">
                        {result.marketingPoints.map((point, index) => (
                          <li key={index} className="text-sm">{point}</li>
                        ))}
                      </ul>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(result.marketingPoints.join('\n• '))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Call to Action</label>
                    <div className="p-3 bg-secondary rounded-md relative group">
                      <p className="font-medium text-primary">{result.callToAction}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(result.callToAction)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border rounded-lg shadow-sm p-12 text-center">
                <Wand2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Ready to Generate</h3>
                <p className="text-muted-foreground">
                  Fill out the form on the left and click "Generate Listing" to create your AI-powered real estate listing.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}