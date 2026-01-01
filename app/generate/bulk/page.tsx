'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Upload, Download, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email?: string
}

interface BulkProperty {
  propertyType: string
  bedrooms: number
  bathrooms: number
  squareFeet?: number
  location: string
  features: string
  targetAudience: string
  additionalDetails?: string
}

export default function BulkGeneratePage() {
  const [user, setUser] = useState<User | null>(null)
  const [userPlan, setUserPlan] = useState<string>('starter')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [properties, setProperties] = useState<BulkProperty[]>([])
  const [results, setResults] = useState<any[]>([])
  const [progress, setProgress] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth?redirect=/generate/bulk')
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
        router.push('/pricing')
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

  const downloadSampleCSV = () => {
    const sampleData = `propertyType,bedrooms,bathrooms,squareFeet,location,features,targetAudience,additionalDetails
Single Family Home,3,2,1800,"Seattle WA","Updated Kitchen,Hardwood Floors,Garage",First-time homebuyers,"Recently renovated"
Condo/Apartment,2,2,1200,"Downtown Portland OR","Granite Countertops,Pool,Security System",Young professionals,"High-rise building with city views"
Townhouse,4,3,2200,"Austin TX","Fireplace,Deck/Patio,Master Suite",Growing families,"Family-friendly neighborhood"`
    
    const blob = new Blob([sampleData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-properties.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/csv') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive'
      })
      return
    }

    setCsvFile(file)
    parseCSV(file)
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim())
      
      const parsedProperties: BulkProperty[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const property: any = {}
        
        headers.forEach((header, index) => {
          property[header] = values[index]
        })
        
        if (property.propertyType && property.location) {
          parsedProperties.push({
            propertyType: property.propertyType,
            bedrooms: parseInt(property.bedrooms) || 3,
            bathrooms: parseFloat(property.bathrooms) || 2,
            squareFeet: property.squareFeet ? parseInt(property.squareFeet) : undefined,
            location: property.location,
            features: property.features || '',
            targetAudience: property.targetAudience || 'General buyers',
            additionalDetails: property.additionalDetails || ''
          })
        }
      }
      
      setProperties(parsedProperties)
      toast({
        title: 'CSV uploaded successfully',
        description: `Found ${parsedProperties.length} properties to process`
      })
    }
    
    reader.readAsText(file)
  }

  const generateBulkListings = async () => {
    if (properties.length === 0) {
      toast({
        title: 'No properties to process',
        description: 'Please upload a CSV file first',
        variant: 'destructive'
      })
      return
    }

    setGenerating(true)
    setProgress(0)
    const generatedResults: any[] = []

    try {
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i]
        
        // Convert features string to array
        const featuresArray = property.features 
          ? property.features.split(',').map(f => f.trim())
          : []

        const formData = {
          propertyType: property.propertyType,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          squareFeet: property.squareFeet || null,
          features: featuresArray,
          location: property.location,
          targetAudience: property.targetAudience,
          priceRange: null,
          additionalDetails: property.additionalDetails || '',
          listingStyle: 'standard',
          tone: 'professional',
          wordCount: 'standard'
        }

        const response = await fetch('/api/generate/listing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          const data = await response.json()
          generatedResults.push({
            property,
            listing: data.data,
            index: i + 1
          })
        } else {
          generatedResults.push({
            property,
            error: 'Failed to generate listing',
            index: i + 1
          })
        }

        setProgress(((i + 1) / properties.length) * 100)
        
        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      setResults(generatedResults)
      toast({
        title: 'Bulk generation complete!',
        description: `Generated ${generatedResults.filter(r => !r.error).length} listings`
      })

    } catch (error) {
      toast({
        title: 'Generation failed',
        description: 'An error occurred during bulk generation',
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  const downloadResults = () => {
    const csvContent = [
      ['Property Type', 'Location', 'Title', 'Description', 'Highlights', 'Marketing Points', 'Call to Action'].join(','),
      ...results.filter(r => !r.error).map(result => [
        result.property.propertyType,
        result.property.location,
        `"${result.listing.title}"`,
        `"${result.listing.description.replace(/"/g, '""')}"`,
        `"${result.listing.highlights.join('; ')}"`,
        `"${result.listing.marketingPoints.join('; ')}"`,
        `"${result.listing.callToAction}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bulk-listings-${Date.now()}.csv`
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
              <h1 className="text-xl font-bold">Bulk Generation</h1>
              <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">Pro Only</span>
            </div>
            {results.length > 0 && (
              <Button onClick={downloadResults} className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Download Results
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions */}
        <div className="bg-card border rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">How Bulk Generation Works</h2>
          <div className="space-y-4 text-sm">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">1</div>
              <div>
                <p className="font-medium">Download the sample CSV template</p>
                <p className="text-muted-foreground">Use our template to ensure proper formatting</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">2</div>
              <div>
                <p className="font-medium">Fill in your property details</p>
                <p className="text-muted-foreground">Add property information for each listing you want to generate</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">3</div>
              <div>
                <p className="font-medium">Upload and generate</p>
                <p className="text-muted-foreground">Upload your CSV and let AI create all your listings at once</p>
              </div>
            </div>
          </div>
          
          <Button onClick={downloadSampleCSV} variant="outline" className="mt-6">
            <FileText className="h-4 w-4 mr-2" />
            Download Sample CSV
          </Button>
        </div>

        {/* Upload Section */}
        <div className="bg-card border rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Upload Properties</h2>
          
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Upload your CSV file</p>
              <p className="text-sm text-muted-foreground">
                Select a CSV file with your property details
              </p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
            >
              Choose CSV File
            </label>
          </div>

          {csvFile && (
            <div className="mt-4 p-4 bg-secondary rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{csvFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {properties.length} properties ready to process
                  </p>
                </div>
                <Button
                  onClick={generateBulkListings}
                  disabled={generating || properties.length === 0}
                  className="flex items-center"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Generating... ({Math.round(progress)}%)
                    </>
                  ) : (
                    <>
                      Generate All Listings
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Progress */}
        {generating && (
          <div className="bg-card border rounded-lg shadow-sm p-6 mb-8">
            <h3 className="font-medium mb-2">Generation Progress</h3>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-card border rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Generated Listings</h2>
              <div className="text-sm text-muted-foreground">
                {results.filter(r => !r.error).length} successful, {results.filter(r => r.error).length} failed
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">
                        {result.property.propertyType} - {result.property.location}
                      </h4>
                      {result.error ? (
                        <div className="flex items-center text-destructive mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm">{result.error}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.listing?.title}
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-secondary px-2 py-1 rounded">
                      #{result.index}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}