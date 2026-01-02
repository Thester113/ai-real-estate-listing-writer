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

interface ListingVariation {
  variationType: 'professional' | 'storytelling' | 'luxury'
  variationLabel: string
  title: string
  description: string
  highlights: string[]
  marketingPoints: string[]
  callToAction: string
}

interface SocialMediaContent {
  instagram: {
    caption: string
    hashtags: string[]
    characterCount: number
  }
  facebook: {
    post: string
    characterCount: number
  }
}

interface ListingResult {
  title: string
  description: string
  highlights: string[]
  marketingPoints: string[]
  callToAction: string
  variations?: ListingVariation[] // Phase 2: Multiple variations
  socialMedia?: SocialMediaContent // Phase 3: Social media posts
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
  const [resultMeta, setResultMeta] = useState<any | null>(null) // Store API metadata
  const [selectedVariation, setSelectedVariation] = useState(0) // Track which variation is shown
  const [listingStyle, setListingStyle] = useState('standard')
  const [tone, setTone] = useState('professional')
  const [wordCount, setWordCount] = useState('standard')
  const [includeKeywords, setIncludeKeywords] = useState(false)
  const [customKeywords, setCustomKeywords] = useState('')
  const [metaFriendly, setMetaFriendly] = useState(false)
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
        // Meta-friendly mode is available to all users
        metaFriendly,
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
      setResultMeta(data.meta) // Store metadata including market context
      setSelectedVariation(0) // Reset to first variation

      const variationsNotice = data.data.variations ? ` (${data.data.variations.length} variations)` : ''
      const marketDataNotice = data.meta.marketContext?.dataInjected
        ? ` + market data from ZIP ${data.meta.marketContext.zipCode}`
        : ''

      toast({
        title: 'Listing generated!',
        description: `Created ${data.meta.wordCount}-word listing${variationsNotice}${marketDataNotice}`
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
    setResultMeta(null) // Clear metadata too
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

  // Return nothing during auth check to prevent flash
  if (loading || !user) {
    return null
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
                    href="/pricing"
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
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value)
                        setFormData(prev => ({ ...prev, bedrooms: value }))
                      }}
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
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                        setFormData(prev => ({ ...prev, bathrooms: value }))
                      }}
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

                {/* Meta-Friendly Mode Toggle - Available to ALL users */}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          id="metaFriendly"
                          checked={metaFriendly}
                          onChange={(e) => setMetaFriendly(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="metaFriendly" className="font-medium text-sm text-blue-900 dark:text-blue-100">
                          Meta-Friendly Mode
                        </label>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          For Ads
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 ml-6">
                        Generates Fair Housing-compliant copy for Facebook & Instagram ads.
                        Avoids discriminatory language and focuses on property features only.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toast({
                          title: 'About Meta-Friendly Mode',
                          description: 'Meta (Facebook/Instagram) requires real estate ads to comply with Fair Housing policies. This mode avoids terms that could suggest preference based on race, religion, familial status, or other protected classes.',
                        })
                      }}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex-shrink-0"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* Warning when conflicting audience is selected */}
                  {metaFriendly && ['Growing families', 'Empty nesters', 'Retirees', 'Young professionals'].includes(formData.targetAudience) && (
                    <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> With Meta-Friendly mode, your listing will use neutral language
                      instead of targeting &quot;{formData.targetAudience}&quot; to comply with Fair Housing policies.
                    </div>
                  )}
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
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-semibold">Generated Listing</h2>
                    {resultMeta?.marketContext?.dataInjected && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        📊 Enhanced with Market Data
                      </span>
                    )}
                    {resultMeta?.metaFriendly && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ✓ Meta-Friendly
                      </span>
                    )}
                  </div>
                  <Button onClick={generateNewListing} variant="outline" size="sm">
                    Generate New
                  </Button>
                </div>

                {/* Variation Tabs (Phase 2) */}
                {result.variations && result.variations.length > 0 && (
                  <div className="border-b mb-6">
                    <div className="flex space-x-1">
                      {result.variations.map((variation, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedVariation(index)}
                          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                            selectedVariation === index
                              ? 'border-primary text-primary bg-primary/5'
                              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                          }`}
                        >
                          {variation.variationLabel}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Get current variation data (DRY helper) */}
                  {(() => {
                    const currentVariation = result.variations && result.variations[selectedVariation]
                      ? result.variations[selectedVariation]
                      : result // Backward compatibility

                    return (
                      <>
                        {/* Title */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Title</label>
                          <div className="p-3 bg-secondary rounded-md relative group">
                            <p className="font-medium">{currentVariation.title}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyToClipboard(currentVariation.title)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Description</label>
                          <div className="p-3 bg-secondary rounded-md relative group">
                            <p className="whitespace-pre-wrap">{currentVariation.description}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyToClipboard(currentVariation.description)}
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
                              {currentVariation.highlights.map((highlight, index) => (
                                <li key={index} className="text-sm">{highlight}</li>
                              ))}
                            </ul>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyToClipboard(currentVariation.highlights.join('\n• '))}
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
                              {currentVariation.marketingPoints.map((point, index) => (
                                <li key={index} className="text-sm">{point}</li>
                              ))}
                            </ul>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyToClipboard(currentVariation.marketingPoints.join('\n• '))}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Call to Action */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Call to Action</label>
                          <div className="p-3 bg-secondary rounded-md relative group">
                            <p className="font-medium text-primary">{currentVariation.callToAction}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyToClipboard(currentVariation.callToAction)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Export Options */}
                        <div>
                          <label className="block text-sm font-medium mb-3">Export Options</label>
                          <ExportOptions listing={currentVariation} userPlan={userPlan as 'starter' | 'pro'} />
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* Social Media Posts (Phase 3) */}
                {result.socialMedia && (
                  <div className="mt-6 bg-card border rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      📱 Social Media Posts
                      <span className="text-xs font-normal px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        Ready to Share
                      </span>
                    </h3>

                    {/* Instagram */}
                    <div className="mb-4 p-4 border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium flex items-center gap-2 text-purple-900">
                          <span>📷</span> Instagram
                        </h4>
                        <span className="text-xs text-purple-700">
                          {result.socialMedia.instagram.characterCount} characters
                        </span>
                      </div>
                      <p className="text-sm mb-3 text-purple-900">{result.socialMedia.instagram.caption}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {result.socialMedia.instagram.hashtags.map((tag, i) => (
                          <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-purple-300 hover:bg-purple-100"
                        onClick={() => copyToClipboard(
                          `${result.socialMedia?.instagram.caption}\n\n${result.socialMedia?.instagram.hashtags.map(t => `#${t}`).join(' ')}`
                        )}
                      >
                        <Copy className="h-3 w-3 mr-2" />
                        Copy Instagram Post
                      </Button>
                    </div>

                    {/* Facebook */}
                    <div className="p-4 border border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium flex items-center gap-2 text-blue-900">
                          <span>👍</span> Facebook
                        </h4>
                        <span className="text-xs text-blue-700">
                          {result.socialMedia.facebook.characterCount} characters
                        </span>
                      </div>
                      <p className="text-sm mb-3 text-blue-900">{result.socialMedia.facebook.post}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-blue-300 hover:bg-blue-100"
                        onClick={() => copyToClipboard(result.socialMedia?.facebook.post || '')}
                      >
                        <Copy className="h-3 w-3 mr-2" />
                        Copy Facebook Post
                      </Button>
                    </div>
                  </div>
                )}
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