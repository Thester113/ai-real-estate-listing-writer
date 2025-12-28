# Logo Setup Instructions

I've created SVG versions of your logo and updated all site headers. To complete the logo setup, please save your PNG logo files to the following locations:

## Required PNG Files

Please save the logo image you provided to these files:

### 1. Main Logo
- **File**: `public/logo.png`
- **Size**: 512x512px recommended
- **Usage**: Homepage, structured data, social media references

### 2. Favicon
- **File**: `public/favicon.ico`
- **Size**: 32x32px (or multi-resolution ICO)
- **Usage**: Browser tab icon

### 3. Apple Touch Icon
- **File**: `public/apple-touch-icon.png`
- **Size**: 180x180px
- **Usage**: iOS home screen icon

### 4. Web App Icons
- **File**: `public/icon-192.png`
- **Size**: 192x192px
- **Usage**: PWA manifest (referenced in site.webmanifest)

- **File**: `public/icon-512.png`
- **Size**: 512x512px
- **Usage**: PWA manifest (referenced in site.webmanifest)

### 5. Open Graph Image
- **File**: `public/og-image.png`
- **Size**: 1200x630px
- **Usage**: Social media sharing (Twitter, Facebook, LinkedIn)
- **Note**: This should be a wider version with text overlay for social media

## Quick Setup Commands

You can use ImageMagick or similar tools to create all sizes from your source PNG:

```bash
# Convert to favicon (requires imagemagick)
convert logo.png -resize 32x32 favicon.ico

# Apple touch icon
convert logo.png -resize 180x180 apple-touch-icon.png

# PWA icons
convert logo.png -resize 192x192 icon-192.png
convert logo.png -resize 512x512 icon-512.png

# OG image (add text overlay if needed)
convert logo.png -resize 1200x630 -gravity center -background white -extent 1200x630 og-image.png
```

## Files Already Created

✅ `/public/logo.svg` - Main SVG logo (used in all headers)
✅ `/public/icon.svg` - Simplified icon version for favicons

## What I've Updated

All site headers now use the new logo:
- ✅ Homepage (`app/page.tsx`)
- ✅ Pricing page (`app/pricing/page.tsx`)
- ✅ Dashboard (`app/dashboard/page.tsx`)
- ✅ Contact page (`app/contact/page.tsx`)
- ✅ All branding changed from "PropertyWriter" → "AI Property Writer"

## Verification

After adding the PNG files, verify by:
1. Check browser tab for favicon
2. View homepage to see logo in header
3. Share a page on social media to test og-image
4. Add site to iOS home screen to test apple-touch-icon

## Current Status

- **SVG Logo**: ✅ Created and deployed
- **PNG Files**: ⏳ Awaiting your source PNG
- **Headers**: ✅ Updated across all pages
- **Branding**: ✅ Consistent "AI Property Writer" everywhere
