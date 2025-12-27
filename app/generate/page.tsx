'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/utils'
import { ArrowLeft, Wand2, Copy, Download, Share } from 'lucide-react'
import Link from 'next/link'
import { MarketAnalysis } from '@/components/market-analysis'
import { ExportOptions } from '@/components/export-options'

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
  // Pro features
  listingStyle?: string
  tone?: string
  wordCount?: string
  includeKeywords?: boolean
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

// Pro-only options
const listingStyles = [
  { value: 'standard', label: 'Standard', description: 'Professional, balanced approach', pro: false },
  { value: 'luxury', label: 'Luxury', description: 'Sophisticated, high-end appeal', pro: true },
  { value: 'investment', label: 'Investment Focus', description: 'ROI and rental potential emphasis', pro: true },
  { value: 'family', label: 'Family Lifestyle', description: 'Emotional, family-centered appeal', pro: true },
  { value: 'modern', label: 'Modern Contemporary', description: 'Sleek, cutting-edge features', pro: true },
  { value: 'traditional', label: 'Classic Traditional', description: 'Timeless charm and character', pro: true }
]

const toneOptions = [
  { value: 'professional', label: 'Professional', pro: false },
  { value: 'conversational', label: 'Conversational', pro: true },
  { value: 'upscale', label: 'Upscale Sophisticated', pro: true },
  { value: 'warm', label: 'Warm & Inviting', pro: true },
  { value: 'energetic', label: 'Dynamic & Energetic', pro: true },
  { value: 'authoritative', label: 'Expert Authority', pro: true }
]

const wordCountOptions = [
  { value: 'standard', label: '150-200 words', description: 'Concise and focused', pro: false },
  { value: 'detailed', label: '250-350 words', description: 'Comprehensive details', pro: true },
  { value: 'extensive', label: '400-500 words', description: 'Full marketing content', pro: true }
]

export default function GeneratePage() {
  const [user, setUser] = useState<User | null>(null)
  const [userPlan, setUserPlan] = useState<string>('starter')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<ListingResult | null>(null)
  const [listingStyle, setListingStyle] = useState('standard')
  const [tone, setTone] = useState('professional')
  const [wordCount, setWordCount] = useState('standard')
  const [includeKeywords, setIncludeKeywords] = useState(false)
  const [customKeywords, setCustomKeywords] = useState('')
  const [formData, setFormData] = useState<ListingFormData>({
    propertyType: '',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: null,
    features: [],
    location: '',
    targetAudience: '',
    priceRange: null,
    additionalDetails: '',
    listingStyle: 'standard',
    tone: 'professional',
    wordCount: 'standard',
    includeKeywords: false
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
      
      // Get user profile to check plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single()
      
      if (profile) {
        setUserPlan((profile as any).plan || 'starter')
      }
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
      // Prepare the form data with Pro features
      const submissionData = {
        ...formData,
        // Include Pro features if user has Pro plan
        ...(userPlan === 'pro' && {
          listingStyle,
          tone,
          wordCount,
          includeKeywords,
          customKeywords: includeKeywords ? customKeywords : undefined
        })
      }

      console.log('📤 Sending to API:', {
        userPlan,
        listingStyle,
        tone,
        wordCount,
        includeKeywords,
        submissionData: {
          listingStyle: submissionData.listingStyle,
          tone: submissionData.tone,
          wordCount: submissionData.wordCount
        }
      })

      const response = await fetch('/api/generate/listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(submissionData)
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

      // Check if it's a limit reached error
      const errorMessage = getErrorMessage(error)
      if (errorMessage.includes('limit') || errorMessage.includes('Monthly generation limit reached')) {
        toast({
          title: 'Monthly limit reached',
          description: userPlan === 'starter'
            ? 'Upgrade to Pro for 500 generations per month!'
            : 'Your limit will reset next month.',
          variant: 'destructive'
        })
      } else if (errorMessage.includes('Pro feature') || errorMessage.includes('Pro-only')) {
        toast({
          title: 'Pro feature required',
          description: 'This feature is only available on the Pro plan.',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Generation failed',
          description: errorMessage,
          variant: 'destructive'
        })
      }
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
      additionalDetails: '',
      listingStyle: 'standard',
      tone: 'professional',
      wordCount: 'standard',
      includeKeywords: false
    })
    // Reset Pro feature states
    setListingStyle('standard')
    setTone('professional')
    setWordCount('standard')
    setIncludeKeywords(false)
    setCustomKeywords('')
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Property Details</h2>
                {userPlan === 'starter' && (
                  <Link
                    href="/dashboard?upgrade=true"
                    className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1.5 rounded-full hover:shadow-lg transition-all"
                  >
                    ✨ Upgrade to Pro for Advanced Features
                  </Link>
                )}
              </div>
              
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
                    placeholder="e.g. Seattle, WA 98101"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Include ZIP code for accurate market analysis
                  </p>
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

                {/* Pro Features Section */}
                {userPlan === 'pro' && (
                  <div className="border-t border-border pt-6 mt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <span className="mr-2">✨</span>
                      Pro Features
                      <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                        Pro Only
                      </span>
                    </h3>
                    
                    {/* Listing Style */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-3">
                        Listing Style
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {listingStyles.map((style) => (
                          <div
                            key={style.value}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              listingStyle === style.value
                                ? 'border-primary bg-primary/5'
                                : 'border-input hover:border-primary/50'
                            }`}
                            onClick={() => setListingStyle(style.value)}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-sm">{style.label}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{style.description}</p>
                              </div>
                              {style.pro && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  Pro
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tone Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-3">
                        Tone & Voice
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {toneOptions.map((toneOption) => (
                          <button
                            key={toneOption.value}
                            type="button"
                            className={`p-2 text-sm border rounded-md transition-all ${
                              tone === toneOption.value
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-input hover:border-primary/50'
                            }`}
                            onClick={() => setTone(toneOption.value)}
                          >
                            {toneOption.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Word Count */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-3">
                        Content Length
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {wordCountOptions.map((option) => (
                          <div
                            key={option.value}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              wordCount === option.value
                                ? 'border-primary bg-primary/5'
                                : 'border-input hover:border-primary/50'
                            }`}
                            onClick={() => setWordCount(option.value)}
                          >
                            <h4 className="font-medium text-sm">{option.label}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SEO Keywords */}
                    <div className="mb-6">
                      <div className="flex items-center mb-3">
                        <input
                          type="checkbox"
                          id="includeKeywords"
                          checked={includeKeywords}
                          onChange={(e) => setIncludeKeywords(e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                        />
                        <label htmlFor="includeKeywords" className="ml-2 text-sm font-medium">
                          Include SEO Keywords
                        </label>
                      </div>
                      {includeKeywords && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={customKeywords}
                            onChange={(e) => setCustomKeywords(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Enter keywords separated by commas (e.g., modern home, downtown, investment property)"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            These keywords will be naturally integrated into your listing content for better SEO.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
            {/* Market Analysis for Pro users */}
            {userPlan === 'pro' && formData.location && formData.propertyType && (
              <MarketAnalysis 
                location={formData.location}
                propertyType={formData.propertyType}
                priceRange={formData.priceRange}
              />
            )}
            
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

                  {/* Export Options */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Export Options</label>
                    <ExportOptions listing={result} userPlan={userPlan as 'starter' | 'pro'} />
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