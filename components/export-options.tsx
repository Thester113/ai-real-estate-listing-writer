'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, Image as ImageIcon, Palette, Settings } from 'lucide-react'

interface ListingResult {
  title: string
  description: string
  highlights: string[]
  marketingPoints: string[]
  callToAction: string
}

interface ExportOptionsProps {
  listing: ListingResult
  userPlan: 'starter' | 'pro'
}

interface BrandingOptions {
  agentName: string
  agencyName: string
  phone: string
  email: string
  website: string
  logo?: File
  colors: {
    primary: string
    accent: string
  }
}

export function ExportOptions({ listing, userPlan }: ExportOptionsProps) {
  const [showBrandingOptions, setShowBrandingOptions] = useState(false)
  const [branding, setBranding] = useState<BrandingOptions>({
    agentName: '',
    agencyName: '',
    phone: '',
    email: '',
    website: '',
    colors: {
      primary: '#2563eb',
      accent: '#3b82f6'
    }
  })

  const exportAsText = (includeBranding = false) => {
    let content = `${listing.title}

${listing.description}

Key Features:
${listing.highlights.map(h => `• ${h}`).join('\n')}

Marketing Points:
${listing.marketingPoints.map(p => `• ${p}`).join('\n')}

${listing.callToAction}`

    if (includeBranding && userPlan === 'pro') {
      content += `\n\n---
${branding.agentName ? `Agent: ${branding.agentName}\n` : ''}${branding.agencyName ? `Agency: ${branding.agencyName}\n` : ''}${branding.phone ? `Phone: ${branding.phone}\n` : ''}${branding.email ? `Email: ${branding.email}\n` : ''}${branding.website ? `Website: ${branding.website}` : ''}`
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `listing-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAsHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${listing.title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background: linear-gradient(135deg, ${branding.colors.primary}15 0%, ${branding.colors.accent}15 100%);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .title {
            font-size: 2.5em;
            font-weight: bold;
            color: ${branding.colors.primary};
            margin-bottom: 10px;
        }
        .description {
            font-size: 1.1em;
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .section {
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .section h3 {
            color: ${branding.colors.primary};
            border-bottom: 2px solid ${branding.colors.accent};
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        ul {
            list-style-type: none;
            padding: 0;
        }
        li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        li:before {
            content: "✓ ";
            color: ${branding.colors.accent};
            font-weight: bold;
        }
        .cta {
            text-align: center;
            font-size: 1.3em;
            font-weight: bold;
            color: ${branding.colors.primary};
            padding: 20px;
            background: linear-gradient(45deg, ${branding.colors.primary}20, ${branding.colors.accent}20);
            border-radius: 8px;
            margin: 20px 0;
        }
        .branding {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background: ${branding.colors.primary};
            color: white;
            border-radius: 8px;
        }
        .branding h4 {
            margin: 0 0 10px 0;
            font-size: 1.2em;
        }
        .branding p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${listing.title}</div>
    </div>
    
    <div class="description">
        ${listing.description.split('\n').map(p => `<p>${p}</p>`).join('')}
    </div>
    
    <div class="section">
        <h3>Key Features</h3>
        <ul>
            ${listing.highlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
    </div>
    
    <div class="section">
        <h3>Marketing Points</h3>
        <ul>
            ${listing.marketingPoints.map(p => `<li>${p}</li>`).join('')}
        </ul>
    </div>
    
    <div class="cta">
        ${listing.callToAction}
    </div>
    
    ${userPlan === 'pro' && (branding.agentName || branding.agencyName) ? `
    <div class="branding">
        ${branding.agentName ? `<h4>${branding.agentName}</h4>` : ''}
        ${branding.agencyName ? `<p>${branding.agencyName}</p>` : ''}
        ${branding.phone ? `<p>📞 ${branding.phone}</p>` : ''}
        ${branding.email ? `<p>✉️ ${branding.email}</p>` : ''}
        ${branding.website ? `<p>🌐 ${branding.website}</p>` : ''}
    </div>
    ` : ''}
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `listing-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAsMarkdown = () => {
    let content = `# ${listing.title}

${listing.description}

## Key Features

${listing.highlights.map(h => `- ${h}`).join('\n')}

## Marketing Points

${listing.marketingPoints.map(p => `- ${p}`).join('\n')}

## Call to Action

**${listing.callToAction}**`

    if (userPlan === 'pro' && (branding.agentName || branding.agencyName)) {
      content += `\n\n---

${branding.agentName ? `**Agent:** ${branding.agentName}  \n` : ''}${branding.agencyName ? `**Agency:** ${branding.agencyName}  \n` : ''}${branding.phone ? `**Phone:** ${branding.phone}  \n` : ''}${branding.email ? `**Email:** ${branding.email}  \n` : ''}${branding.website ? `**Website:** ${branding.website}` : ''}`
    }

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `listing-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Basic Export Options */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => exportAsText(false)} variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Export as Text
        </Button>
        
        {userPlan === 'pro' && (
          <>
            <Button onClick={exportAsHTML} variant="outline" size="sm">
              <ImageIcon className="h-4 w-4 mr-2" />
              Export as HTML
            </Button>
            
            <Button onClick={exportAsMarkdown} variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export as Markdown
            </Button>
            
            <Button 
              onClick={() => setShowBrandingOptions(!showBrandingOptions)} 
              variant="outline" 
              size="sm"
            >
              <Palette className="h-4 w-4 mr-2" />
              Branding Options
              <span className="ml-1 text-xs bg-primary/10 text-primary px-1 rounded">Pro</span>
            </Button>
          </>
        )}
      </div>

      {/* Pro Branding Options */}
      {userPlan === 'pro' && showBrandingOptions && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Settings className="h-4 w-4 text-primary" />
            <h4 className="font-medium">White-Label Export Settings</h4>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Pro Feature</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Agent Name</label>
              <input
                type="text"
                value={branding.agentName}
                onChange={(e) => setBranding(prev => ({ ...prev, agentName: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Agency Name</label>
              <input
                type="text"
                value={branding.agencyName}
                onChange={(e) => setBranding(prev => ({ ...prev, agencyName: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="Your agency"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={branding.phone}
                onChange={(e) => setBranding(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={branding.email}
                onChange={(e) => setBranding(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="agent@agency.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                value={branding.website}
                onChange={(e) => setBranding(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="https://youragency.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Primary Color</label>
              <input
                type="color"
                value={branding.colors.primary}
                onChange={(e) => setBranding(prev => ({ 
                  ...prev, 
                  colors: { ...prev.colors, primary: e.target.value }
                }))}
                className="w-full h-10 border border-input rounded-md"
              />
            </div>
          </div>
          
          <div className="flex space-x-2 pt-3">
            <Button onClick={() => exportAsText(true)} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export with Branding
            </Button>
            
            <Button onClick={exportAsHTML} variant="outline" size="sm">
              <ImageIcon className="h-4 w-4 mr-2" />
              Export Branded HTML
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}