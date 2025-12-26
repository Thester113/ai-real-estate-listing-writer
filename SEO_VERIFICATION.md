# SEO Verification Guide

This document provides step-by-step verification for SEO implementation on https://www.aipropertywriter.com

## Quick Verification (Production)

### 1. Verify robots.txt

```bash
curl https://www.aipropertywriter.com/robots.txt
```

**Expected output:**
```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /billing
Disallow: /history
Disallow: /admin
Disallow: /api/
Disallow: /_next/

Sitemap: https://www.aipropertywriter.com/sitemap.xml
```

✅ **Pass criteria:**
- Proper newlines (not single line)
- No spaces in sitemap URL
- Correct domain: `https://www.aipropertywriter.com` (with www)
- All private routes disallowed

---

### 2. Verify sitemap.xml

```bash
curl https://www.aipropertywriter.com/sitemap.xml
```

**Expected:**
- Valid XML structure
- Contains marketing pages: `/`, `/pricing`, `/blog`
- Contains blog post URLs: `/blog/[slug]`
- Does NOT contain: `/dashboard`, `/billing`, `/history`, `/admin`, `/api/*`

✅ **Pass criteria:**
- All URLs use `https://www.aipropertywriter.com`
- Valid `<lastmod>` dates
- No private/protected routes

**Test with xmllint:**
```bash
curl -s https://www.aipropertywriter.com/sitemap.xml | xmllint --format -
```

---

### 3. Verify Homepage Metadata

```bash
curl -s https://www.aipropertywriter.com | grep -E '(canonical|og:|twitter:)'
```

**Expected tags:**
```html
<link rel="canonical" href="https://www.aipropertywriter.com/" />
<meta property="og:url" content="https://www.aipropertywriter.com" />
<meta property="og:type" content="website" />
<meta property="og:title" content="AI Property Writer – Generate Real Estate Listing Copy Instantly" />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://www.aipropertywriter.com/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
```

✅ **Pass criteria:**
- Canonical URL present
- OpenGraph tags complete
- Twitter card tags present
- All URLs use www subdomain

---

### 4. Verify Structured Data (JSON-LD)

```bash
curl -s https://www.aipropertywriter.com | grep -A 50 'application/ld+json'
```

**Expected schemas:**
1. **SoftwareApplication** - Product info with pricing
2. **Organization** - Company info

**Validate with Google:**
Visit: https://search.google.com/test/rich-results
Enter: `https://www.aipropertywriter.com`

✅ **Pass criteria:**
- No errors in structured data
- SoftwareApplication and Organization detected

---

### 5. Verify Blog Post Metadata

**Test a blog post:**
```bash
curl -s https://www.aipropertywriter.com/blog/[slug] | grep -E '(canonical|application/ld+json)' -A 10
```

**Expected:**
- Canonical URL: `<link rel="canonical" href="https://www.aipropertywriter.com/blog/[slug]" />`
- BlogPosting schema with author, datePublished, publisher

✅ **Pass criteria:**
- Unique title/description per post
- BlogPosting schema present
- Canonical URL correct

---

### 6. Verify Private Pages (noindex)

**Test dashboard:**
```bash
curl -s https://www.aipropertywriter.com/dashboard | grep -i robots
```

**Expected:**
```html
<meta name="robots" content="noindex, nofollow" />
```

**Test all private pages:**
- `/dashboard` - Should have noindex
- `/history` - Should have noindex
- `/admin` - Should have noindex

✅ **Pass criteria:**
- All private pages have `noindex, nofollow` meta tag

---

### 7. Verify RSS Feed

```bash
curl https://www.aipropertywriter.com/rss.xml
```

**Expected:**
- Valid RSS 2.0 XML
- Contains blog posts
- Proper CDATA escaping

✅ **Pass criteria:**
- Feed validates with https://validator.w3.org/feed/

---

## Google Search Console Verification

### 1. Submit Sitemap
1. Go to: https://search.google.com/search-console
2. Select property: `https://www.aipropertywriter.com`
3. Navigate to: **Sitemaps**
4. Submit: `sitemap.xml`
5. Wait 24-48 hours for indexing

### 2. URL Inspection
Test key URLs:
- `/` (homepage)
- `/pricing`
- `/blog`
- `/blog/[any-post]`

**For each URL:**
1. Go to: **URL Inspection**
2. Enter full URL
3. Click "Request Indexing"

### 3. Coverage Report
Check for:
- ✅ Valid pages indexed
- ❌ No errors for marketing pages
- ✅ Private pages excluded (or marked noindex)

---

## Performance Verification

### PageSpeed Insights
```bash
# Test with lighthouse
npx lighthouse https://www.aipropertywriter.com --view
```

**Target scores:**
- Performance: > 90
- SEO: 100
- Best Practices: > 90

### Core Web Vitals
Visit: https://pagespeed.web.dev/

Test: `https://www.aipropertywriter.com`

**Target metrics:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

---

## Automated Testing

Create a test script:

```bash
#!/bin/bash
# seo-test.sh

echo "🔍 Testing SEO Implementation..."
echo ""

# Test robots.txt
echo "1. Testing robots.txt..."
ROBOTS=$(curl -s https://www.aipropertywriter.com/robots.txt)
if echo "$ROBOTS" | grep -q "www.aipropertywriter.com/sitemap.xml"; then
  echo "✅ robots.txt: PASS"
else
  echo "❌ robots.txt: FAIL"
fi

# Test sitemap.xml
echo ""
echo "2. Testing sitemap.xml..."
SITEMAP=$(curl -s https://www.aipropertywriter.com/sitemap.xml)
if echo "$SITEMAP" | grep -q "<urlset"; then
  echo "✅ sitemap.xml: PASS"
else
  echo "❌ sitemap.xml: FAIL"
fi

# Test canonical tag
echo ""
echo "3. Testing canonical tag..."
CANONICAL=$(curl -s https://www.aipropertywriter.com | grep "canonical")
if echo "$CANONICAL" | grep -q "www.aipropertywriter.com"; then
  echo "✅ Canonical tag: PASS"
else
  echo "❌ Canonical tag: FAIL"
fi

# Test OpenGraph
echo ""
echo "4. Testing OpenGraph tags..."
OG=$(curl -s https://www.aipropertywriter.com | grep "og:")
if echo "$OG" | grep -q "og:title"; then
  echo "✅ OpenGraph: PASS"
else
  echo "❌ OpenGraph: FAIL"
fi

# Test structured data
echo ""
echo "5. Testing structured data..."
LD=$(curl -s https://www.aipropertywriter.com | grep "application/ld+json")
if echo "$LD" | grep -q "SoftwareApplication"; then
  echo "✅ Structured data: PASS"
else
  echo "❌ Structured data: FAIL"
fi

echo ""
echo "✅ SEO verification complete!"
```

Make executable and run:
```bash
chmod +x seo-test.sh
./seo-test.sh
```

---

## Common Issues & Solutions

### Issue: robots.txt returns 404
**Solution:** Ensure `app/robots.ts` exists and `public/robots.txt` is deleted

### Issue: Sitemap shows private routes
**Solution:** Check `app/sitemap.ts` excludes `/dashboard`, `/billing`, etc.

### Issue: Homepage not indexing
**Solution:**
1. Check for noindex meta tag
2. Verify robots.txt allows `/`
3. Submit to Search Console

### Issue: Duplicate meta tags
**Solution:** Check for conflicts between `app/layout.tsx` and page metadata

### Issue: Old domain in robots.txt
**Solution:**
1. Delete `public/robots.txt`
2. Update `app/robots.ts` baseUrl
3. Redeploy

---

## Deployment Checklist

Before deploying SEO changes:

- [ ] `app/robots.ts` uses correct domain (`https://www.aipropertywriter.com`)
- [ ] `public/robots.txt` deleted (doesn't exist)
- [ ] `app/sitemap.ts` excludes private routes
- [ ] Private pages have `noindex` metadata
- [ ] Homepage has structured data (SoftwareApplication)
- [ ] Blog posts have BlogPosting schema
- [ ] All pages have canonical URLs
- [ ] OpenGraph images exist at referenced paths
- [ ] Test all URLs return 200 status
- [ ] Run `npm run build` succeeds
- [ ] Test locally with `npm run dev`

After deployment:

- [ ] Verify robots.txt in production
- [ ] Verify sitemap.xml in production
- [ ] Test homepage canonical tag
- [ ] Test OpenGraph previews (Facebook debugger)
- [ ] Submit sitemap to Google Search Console
- [ ] Request indexing for key pages
- [ ] Monitor Search Console for errors
- [ ] Check PageSpeed Insights

---

## Monitoring

### Weekly Checks
- Search Console coverage report
- Index status for key pages
- Search performance metrics
- Core Web Vitals

### Monthly Checks
- Organic traffic trends (Google Analytics)
- Keyword rankings
- Backlink profile
- Technical SEO audit

---

## Resources

- **Google Search Console:** https://search.google.com/search-console
- **Rich Results Test:** https://search.google.com/test/rich-results
- **PageSpeed Insights:** https://pagespeed.web.dev/
- **Schema.org Validator:** https://validator.schema.org/
- **Facebook Debugger:** https://developers.facebook.com/tools/debug/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator
- **RSS Feed Validator:** https://validator.w3.org/feed/

---

## Implementation Details

### Files Modified/Created

1. **app/robots.ts** - Next.js metadata route for robots.txt
2. **app/sitemap.ts** - Dynamic sitemap generation
3. **app/layout.tsx** - Global metadata and icons
4. **app/dashboard/layout.tsx** - Noindex for dashboard
5. **app/history/layout.tsx** - Noindex for history
6. **app/admin/layout.tsx** - Noindex for admin
7. **app/rss.xml/route.ts** - RSS feed
8. **app/page.tsx** - Structured data for homepage
9. **app/blog/[slug]/page.tsx** - BlogPosting schema

### Deleted Files

- **public/robots.txt** - Removed (conflicted with app/robots.ts)

---

Last updated: December 2025
