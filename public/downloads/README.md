# Download Files - TODO

This directory contains downloadable lead magnet PDFs that are delivered when users subscribe via lead magnet pages.

## Required PDF Files

The following PDF files need to be created and placed in this directory:

### 1. `listing-templates.pdf`
**Content Source**: `/listing-templates` page
**Estimated Time**: 1.5 hours
**Pages**: 8-10 pages

**Structure**:
- Cover page with AI Property Writer branding
- 5 complete copy-paste templates:
  1. **Luxury Home Template** - Sophisticated language for high-end properties
  2. **Family Home Template** - Warm, community-focused copy
  3. **Investment Property Template** - ROI and numbers-focused
  4. **Modern Home Template** - Clean, contemporary language
  5. **Starter Home Template** - Accessible, first-time buyer friendly
- Each template includes:
  - Full listing text (150-200 words)
  - Customization tips
  - When to use this template
  - Example customization

**Design Tool**: Canva (recommended) or Figma

---

### 2. `seo-checklist.pdf`
**Content Source**: `/seo-checklist` page
**Estimated Time**: 1.5 hours
**Pages**: 12-15 pages

**Structure**:
- Cover page with branding
- 47-point comprehensive SEO checklist organized by category:
  - **On-Page SEO** (12 items)
  - **Technical SEO** (10 items)
  - **Content SEO** (8 items)
  - **Local SEO for Real Estate** (9 items)
  - **Link Building** (8 items)
- Checkbox format for easy tracking
- Brief explanation for each item
- Color-coded priority levels (High/Medium/Low)

**Design Tool**: Canva (recommended) or Figma

---

### 3. `words-that-sell.pdf`
**Content Source**: `/words-that-sell` page
**Estimated Time**: 1 hour
**Pages**: 8-10 pages

**Structure**:
- Cover page with branding
- 101 power words organized by emotional category:
  - **Luxury & Exclusivity** (20 words)
  - **Family & Safety** (20 words)
  - **Investment & Value** (20 words)
  - **Modern & Contemporary** (20 words)
  - **Action & Urgency** (21 words)
- Each word includes:
  - The word itself (large, bold)
  - Brief definition
  - Usage example in a listing
- Final page: Do's and Don'ts section

**Design Tool**: Canva (recommended) or Figma

---

### 4. `ai-listing-guide.pdf`
**Content Source**: `/ai-listing-guide` page + blog posts + features
**Estimated Time**: 2-3 hours
**Pages**: 25 pages

**Structure**:
- Cover page with branding
- Table of contents
- **Introduction** (2 pages)
  - What is AI for real estate?
  - Why AI Property Writer is different
- **Getting Started** (4 pages)
  - How to use the platform
  - Understanding the 3 variations
  - Using social media posts
  - Leveraging market data
- **Best Practices** (8 pages)
  - Writing effective property details
  - Customizing AI output
  - Choosing the right variation
  - SEO optimization tips
- **Examples** (8 pages)
  - 10 complete before/after examples
  - Different property types
  - Different price ranges
- **Advanced Techniques** (2 pages)
  - Advanced customization
  - Combining multiple outputs
- **Common Mistakes** (1 page)
  - What to avoid
  - How to fix common issues

**Design Tool**: Canva (recommended) or Figma

---

## Design Guidelines

### Branding
- **Logo**: Use `/public/logo.svg`
- **Primary Color**: Use the primary color from the app (check Tailwind config)
- **Fonts**: Use professional, readable fonts
  - Headings: Bold sans-serif (e.g., Inter Bold)
  - Body: Regular sans-serif (e.g., Inter Regular)

### Layout
- Use consistent margins (1 inch on all sides)
- Include page numbers in footer
- Add AI Property Writer logo in header or footer
- Use white space generously for readability

### Colors
- Use brand colors consistently
- Highlight important sections with colored backgrounds
- Use icons and visual elements to break up text

---

## Testing the Downloads

Once PDFs are created:

1. Place the PDF files in this directory (`/public/downloads/`)
2. Test each download URL:
   - https://www.aipropertywriter.com/downloads/listing-templates.pdf
   - https://www.aipropertywriter.com/downloads/seo-checklist.pdf
   - https://www.aipropertywriter.com/downloads/words-that-sell.pdf
   - https://www.aipropertywriter.com/downloads/ai-listing-guide.pdf
3. Test the lead magnet flow:
   - Visit `/listing-templates`, `/seo-checklist`, `/words-that-sell`, `/ai-listing-guide`
   - Submit email on each page
   - Verify download triggers automatically
   - Verify "Download Now" button works

---

## Quick Start with Canva

1. Sign up for Canva (free account works)
2. Search for "Professional Report" or "Guide" templates
3. Choose a clean, professional template
4. Replace template content with the content listed above
5. Update branding with your logo and colors
6. Export as PDF (high quality)
7. Download and place in this directory

**Estimated Total Time**: 4-6 hours for all 4 PDFs

---

## Current Status

- ✅ Download delivery logic implemented
- ✅ API endpoint returns download URLs
- ✅ EmailCapture component triggers downloads
- ✅ **CONTENT READY**: All content is written and ready for design

### Content Files Ready to Use

The complete content for all 4 PDFs is in the `/content` subdirectory:

1. **`content/listing-templates-content.md`** - 5 complete templates with customization tips
2. **`content/seo-checklist-content.md`** - Full 47-point checklist
3. **`content/words-that-sell-content.md`** - All 101 power words organized by category
4. **`content/ai-listing-guide-content.md`** - Complete 25-page guide content

**Next Step:** Open these files, copy content into Canva, apply branding, and export as PDFs.

Once PDFs are created and placed in this directory, the entire download system will be functional!
