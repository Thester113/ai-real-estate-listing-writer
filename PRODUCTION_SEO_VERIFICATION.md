# Production SEO Verification Guide
## https://www.aipropertywriter.com

Complete checklist for verifying SEO implementation after deployment.

---

## ✅ QUICK VERIFICATION (Run Immediately After Deploy)

### 1. Test robots.txt
```bash
curl https://www.aipropertywriter.com/robots.txt
```

**Expected Output:**
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

✅ **PASS Criteria:**
- Domain is `https://www.aipropertywriter.com` (with www)
- NO spaces in sitemap URL
- Proper newlines (not single-line blob)
- All private routes disallowed

---

### 2. Test sitemap.xml
```bash
curl https://www.aipropertywriter.com/sitemap.xml
```

**Expected:**
- Valid XML with `<urlset>` root element
- Contains marketing pages: `/`, `/pricing`, `/blog`
- Contains blog post URLs: `/blog/[slug]`
- Does NOT contain: `/dashboard`, `/billing`, `/history`, `/admin`, `/api/*`

**Validate XML format:**
```bash
curl -s https://www.aipropertywriter.com/sitemap.xml | xmllint --format - | head -50
```

✅ **PASS Criteria:**
- All URLs use `https://www.aipropertywriter.com`
- Valid `<lastmod>` dates (ISO 8601 format)
- Priority values between 0.0-1.0
- No private/protected routes

---

### 3. Test Homepage HTML (SSR)
```bash
curl -s https://www.aipropertywriter.com | head -100
```

**Must contain:**
```html
<title>AI Property Writer – Generate Real Estate Listing Copy Instantly</title>
<meta name="description" content="Generate MLS descriptions..." />
<link rel="canonical" href="https://www.aipropertywriter.com/" />
<h1>AI Real Estate Listing Generator</h1>
```

✅ **PASS Criteria:**
- HTML is NOT empty (server-rendered, not client-only)
- Title tag present
- Meta description present
- Canonical URL present
- H1 tag with real content (not placeholder)
- Internal links to `/pricing` and `/blog` visible in HTML

---

### 4. Test Metadata Tags
```bash
curl -s https://www.aipropertywriter.com | grep -E '(canonical|og:|twitter:|description)'
```

**Expected tags:**
```html
<link rel="canonical" href="https://www.aipropertywriter.com/" />
<meta name="description" content="Generate MLS descriptions..." />
<meta property="og:url" content="https://www.aipropertywriter.com" />
<meta property="og:type" content="website" />
<meta property="og:title" content="AI Property Writer..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://www.aipropertywriter.com/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="https://www.aipropertywriter.com/og-image.png" />
<meta name="twitter:creator" content="@aipropertywriter" />
```

✅ **PASS Criteria:**
- All URLs use correct domain (www subdomain)
- OG image has dimensions (1200x630)
- Twitter card type is `summary_large_image`
- All required tags present

---

### 5. Test Structured Data (JSON-LD)
```bash
curl -s https://www.aipropertywriter.com | grep -A 50 'application/ld+json'
```

**Expected Schemas:**
1. **SoftwareApplication** with:
   - name, description, url, applicationCategory
   - offers (Starter $0, Pro $29)
   - aggregateRating

2. **Organization** with:
   - name, url, logo, description

**Validate with Google:**
1. Visit: https://search.google.com/test/rich-results
2. Enter: `https://www.aipropertywriter.com`
3. Expected: No errors, both schemas detected

✅ **PASS Criteria:**
- SoftwareApplication schema present
- Organization schema present
- Valid JSON (no syntax errors)
- All required properties included

---

### 6. Test Private Pages (Noindex)
```bash
curl -s https://www.aipropertywriter.com/dashboard | grep -i robots
```

**Expected:**
```html
<meta name="robots" content="noindex, nofollow" />
```

**Test all private pages:**
```bash
# Dashboard
curl -s https://www.aipropertywriter.com/dashboard | grep -i robots

# History
curl -s https://www.aipropertywriter.com/history | grep -i robots

# Admin
curl -s https://www.aipropertywriter.com/admin | grep -i robots
```

✅ **PASS Criteria:**
- Each private page has `noindex, nofollow` meta tag
- Protected pages require authentication (redirect or login prompt)

---

### 7. Test RSS Feed
```bash
curl https://www.aipropertywriter.com/rss.xml | head -50
```

**Expected:**
- Valid RSS 2.0 XML structure
- Contains `<rss version="2.0">`
- Has `<channel>` with title, link, description
- Contains recent blog `<item>` entries with proper CDATA

**Validate:**
Visit: https://validator.w3.org/feed/
Enter: `https://www.aipropertywriter.com/rss.xml`

✅ **PASS Criteria:**
- Feed validates with no errors
- Contains blog posts
- CDATA properly escaped

---

### 8. Test Web Manifest
```bash
curl https://www.aipropertywriter.com/site.webmanifest
```

**Expected:**
```json
{
  "name": "AI Property Writer",
  "short_name": "AI PropWriter",
  "start_url": "/",
  "display": "standalone",
  "icons": [...]
}
```

✅ **PASS Criteria:**
- Valid JSON
- Contains name, start_url, display, icons
- Referenced in HTML: `<link rel="manifest" href="/site.webmanifest" />`

---

### 9. Test Blog Post Page
```bash
# Replace [slug] with an actual blog post slug
curl -s https://www.aipropertywriter.com/blog/[slug] | grep -E '(canonical|application/ld+json)' -A 15
```

**Expected:**
- Canonical URL: `<link rel="canonical" href="https://www.aipropertywriter.com/blog/[slug]" />`
- BlogPosting schema with:
  - headline, description, image
  - datePublished, dateModified
  - author (Person)
  - publisher (Organization with logo)

✅ **PASS Criteria:**
- Unique title/description per post
- BlogPosting schema present and valid
- Canonical URL matches current page

---

## 📊 COMPREHENSIVE SEO AUDIT

### Performance Testing

**Google PageSpeed Insights:**
```bash
# Test with Lighthouse CLI
npx lighthouse https://www.aipropertywriter.com --view
```

Visit: https://pagespeed.web.dev/
Test: `https://www.aipropertywriter.com`

**Target Scores:**
- Performance: > 90
- SEO: 100 (critical)
- Best Practices: > 90
- Accessibility: > 90

**Core Web Vitals:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

---

### Crawlability Test

**Test with Screaming Frog (optional):**
1. Download: https://www.screamingfrogseoseo.com/
2. Crawl: `https://www.aipropertywriter.com`
3. Check:
   - Response codes (all public pages should be 200)
   - Indexability (marketing pages indexable, private pages noindex)
   - Canonical URLs (all correct)
   - Meta descriptions (unique per page)
   - H1 tags (one per page, descriptive)

---

### Social Media Preview Testing

**Facebook/LinkedIn Debugger:**
1. Visit: https://developers.facebook.com/tools/debug/
2. Enter: `https://www.aipropertywriter.com`
3. Click "Scrape Again"

**Expected:**
- Image: 1200x630 OG image displays
- Title: "AI Property Writer – Generate Real Estate Listing Copy Instantly"
- Description shows
- URL is correct

**Twitter Card Validator:**
1. Visit: https://cards-dev.twitter.com/validator
2. Enter: `https://www.aipropertywriter.com`

**Expected:**
- Card type: summary_large_image
- Image preview shows
- Title and description display

✅ **PASS Criteria:**
- Previews look correct on both platforms
- Images load properly
- Text is not truncated

---

## 🔍 GOOGLE SEARCH CONSOLE SETUP

### Step 1: Add Property

1. Go to: https://search.google.com/search-console
2. Click "+ Add Property"
3. Choose: **URL prefix**
4. Enter: `https://www.aipropertywriter.com`

### Step 2: Verify Ownership

**Method 1: HTML Tag (Recommended)**
1. Get verification code from Search Console
2. Add to `.env` file:
   ```
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_verification_code_here
   ```
3. Redeploy to Vercel
4. Go back to Search Console and click "Verify"

**Method 2: DNS Record**
1. Get TXT record from Search Console
2. Add to your DNS provider (where you bought www.aipropertywriter.com)
3. Wait 24-48 hours for propagation
4. Click "Verify"

### Step 3: Submit Sitemap

1. In Search Console, navigate to: **Sitemaps** (left sidebar)
2. In "Add a new sitemap" field, enter: `sitemap.xml`
3. Click "Submit"
4. Wait 24-48 hours for Google to crawl

**Expected Result:**
- Status: Success
- Pages discovered: ~10-50+ (depending on blog posts)
- Last read: Recent date

### Step 4: Request Indexing (Priority Pages)

Use **URL Inspection** tool to manually request indexing:

1. Homepage: `https://www.aipropertywriter.com`
2. Pricing: `https://www.aipropertywriter.com/pricing`
3. Blog: `https://www.aipropertywriter.com/blog`
4. Top 3 blog posts

**For each URL:**
1. Paste URL in top search bar
2. Click "Request Indexing"
3. Wait for confirmation

---

### Step 5: Monitor Coverage

Check weekly:
- **Coverage** report (left sidebar)
- Look for errors or warnings
- Ensure all public pages are "Valid"
- Verify private pages are excluded (or marked noindex)

**Common Issues:**
- ❌ "Submitted URL marked noindex" → Check page metadata
- ❌ "Submitted URL seems to be a Soft 404" → Page may be empty
- ❌ "Server error (5xx)" → Check Vercel deployment
- ✅ "Valid" → Page is indexed!

---

## 🚀 BING WEBMASTER TOOLS SETUP

### Step 1: Add Site

1. Go to: https://www.bing.com/webmasters
2. Sign in with Microsoft account
3. Click "Add a site"
4. Enter: `https://www.aipropertywriter.com`

### Step 2: Verify Ownership

**Easy Method: Import from Google**
If you've already verified with Google Search Console:
1. Click "Import from Google Search Console"
2. Authorize access
3. Done!

**Manual Method: XML File**
1. Download verification XML file
2. Upload to `/public` directory in your project
3. Redeploy
4. Click "Verify"

### Step 3: Submit Sitemap

1. Go to: **Sitemaps** section
2. Submit: `https://www.aipropertywriter.com/sitemap.xml`
3. Wait for crawl (usually faster than Google)

---

## 📈 ONGOING MONITORING

### Weekly Tasks
- [ ] Check Search Console for errors
- [ ] Review index status for new blog posts
- [ ] Monitor organic traffic (Google Analytics)
- [ ] Check Core Web Vitals report

### Monthly Tasks
- [ ] Review search performance (queries, clicks, impressions)
- [ ] Audit keyword rankings
- [ ] Check for broken links (Search Console → Coverage)
- [ ] Update old blog posts (if needed)
- [ ] Review and update FAQ schema (if questions change)

### Quarterly Tasks
- [ ] Full technical SEO audit
- [ ] Backlink profile review
- [ ] Competitor analysis
- [ ] Content gap analysis
- [ ] Schema markup updates

---

## 🛠️ AUTOMATED TESTING SCRIPT

Save as `seo-test.sh`:

```bash
#!/bin/bash

echo "🔍 SEO Verification Test - www.aipropertywriter.com"
echo "=================================================="
echo ""

DOMAIN="https://www.aipropertywriter.com"
PASS=0
FAIL=0

# Test 1: robots.txt
echo "1️⃣  Testing robots.txt..."
ROBOTS=$(curl -s "$DOMAIN/robots.txt")
if echo "$ROBOTS" | grep -q "www.aipropertywriter.com/sitemap.xml"; then
  echo "   ✅ PASS: Correct domain in sitemap URL"
  ((PASS++))
else
  echo "   ❌ FAIL: Wrong domain or missing sitemap URL"
  ((FAIL++))
fi

# Test 2: sitemap.xml exists
echo ""
echo "2️⃣  Testing sitemap.xml..."
SITEMAP=$(curl -s "$DOMAIN/sitemap.xml")
if echo "$SITEMAP" | grep -q "<urlset"; then
  echo "   ✅ PASS: Sitemap exists with valid XML"
  ((PASS++))
else
  echo "   ❌ FAIL: Sitemap missing or invalid"
  ((FAIL++))
fi

# Test 3: Homepage canonical
echo ""
echo "3️⃣  Testing homepage canonical tag..."
CANONICAL=$(curl -s "$DOMAIN" | grep "canonical")
if echo "$CANONICAL" | grep -q "www.aipropertywriter.com"; then
  echo "   ✅ PASS: Canonical tag present with correct domain"
  ((PASS++))
else
  echo "   ❌ FAIL: Canonical tag missing or wrong domain"
  ((FAIL++))
fi

# Test 4: Homepage title
echo ""
echo "4️⃣  Testing homepage title tag..."
TITLE=$(curl -s "$DOMAIN" | grep "<title>")
if echo "$TITLE" | grep -q "AI Property Writer"; then
  echo "   ✅ PASS: Title tag present"
  ((PASS++))
else
  echo "   ❌ FAIL: Title tag missing"
  ((FAIL++))
fi

# Test 5: OpenGraph tags
echo ""
echo "5️⃣  Testing OpenGraph tags..."
OG=$(curl -s "$DOMAIN" | grep "og:")
if echo "$OG" | grep -q "og:title\|og:description\|og:image"; then
  echo "   ✅ PASS: OpenGraph tags present"
  ((PASS++))
else
  echo "   ❌ FAIL: OpenGraph tags missing"
  ((FAIL++))
fi

# Test 6: Structured data
echo ""
echo "6️⃣  Testing structured data (JSON-LD)..."
LD=$(curl -s "$DOMAIN" | grep "application/ld+json")
if echo "$LD" | grep -q "SoftwareApplication"; then
  echo "   ✅ PASS: Structured data present"
  ((PASS++))
else
  echo "   ❌ FAIL: Structured data missing"
  ((FAIL++))
fi

# Test 7: RSS feed
echo ""
echo "7️⃣  Testing RSS feed..."
RSS=$(curl -s "$DOMAIN/rss.xml")
if echo "$RSS" | grep -q "<rss version"; then
  echo "   ✅ PASS: RSS feed exists"
  ((PASS++))
else
  echo "   ❌ FAIL: RSS feed missing"
  ((FAIL++))
fi

# Test 8: Web manifest
echo ""
echo "8️⃣  Testing web manifest..."
MANIFEST=$(curl -s "$DOMAIN/site.webmanifest")
if echo "$MANIFEST" | grep -q "name"; then
  echo "   ✅ PASS: Web manifest exists"
  ((PASS++))
else
  echo "   ❌ FAIL: Web manifest missing"
  ((FAIL++))
fi

# Summary
echo ""
echo "=================================================="
echo "📊 TEST SUMMARY"
echo "=================================================="
echo "✅ Passed: $PASS/8"
echo "❌ Failed: $FAIL/8"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED! SEO implementation is correct."
  exit 0
else
  echo "⚠️  Some tests failed. Review the output above."
  exit 1
fi
```

**Usage:**
```bash
chmod +x seo-test.sh
./seo-test.sh
```

---

## 🚨 TROUBLESHOOTING

### Issue: robots.txt returns old domain
**Solution:**
1. Ensure `public/robots.txt` does NOT exist (delete if found)
2. Verify `app/robots.ts` uses correct domain
3. Clear Vercel build cache and redeploy

### Issue: Sitemap empty or missing blog posts
**Solution:**
1. Check Supabase connection in `app/sitemap.ts`
2. Verify blog_posts table has `published = true` entries
3. Check server logs for errors

### Issue: Homepage shows empty HTML
**Solution:**
1. Ensure page component is NOT using `'use client'`
2. Remove any async data fetching that blocks rendering
3. Use Server Components for marketing content

### Issue: Structured data not showing in Google
**Solution:**
1. Validate with: https://search.google.com/test/rich-results
2. Ensure JSON-LD is valid JSON (no syntax errors)
3. Wait 24-48 hours for Google to re-crawl

### Issue: Private pages appearing in search
**Solution:**
1. Verify each private page has layout.tsx with noindex metadata
2. Check Search Console "Removals" tab
3. Request URL removal if already indexed

---

## ✅ DEPLOYMENT CHECKLIST

Before deploying SEO changes:

- [ ] `app/robots.ts` exists and uses `https://www.aipropertywriter.com`
- [ ] `public/robots.txt` does NOT exist (deleted)
- [ ] `app/sitemap.ts` excludes private routes
- [ ] `app/layout.tsx` has complete metadata
- [ ] Homepage has SoftwareApplication + Organization schemas
- [ ] Blog posts have BlogPosting schema
- [ ] Private pages have noindex in their layout.tsx
- [ ] All canonical URLs use `https://www.aipropertywriter.com`
- [ ] OG images exist at referenced paths
- [ ] site.webmanifest exists
- [ ] RSS feed works
- [ ] Run `npm run build` succeeds locally
- [ ] Test key URLs with curl before pushing

After deployment:

- [ ] Run automated test script (`./seo-test.sh`)
- [ ] Verify robots.txt in production
- [ ] Verify sitemap.xml in production
- [ ] Test homepage renders HTML (not empty)
- [ ] Test social media previews
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Request indexing for priority pages
- [ ] Monitor Search Console for 48 hours

---

## 📚 RESOURCES

**SEO Tools:**
- Google Search Console: https://search.google.com/search-console
- Google Rich Results Test: https://search.google.com/test/rich-results
- PageSpeed Insights: https://pagespeed.web.dev/
- Schema.org Validator: https://validator.schema.org/
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- RSS Validator: https://validator.w3.org/feed/
- Bing Webmaster Tools: https://www.bing.com/webmasters

**Documentation:**
- Next.js Metadata API: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Next.js Metadata Routes: https://nextjs.org/docs/app/api-reference/file-conventions/metadata
- Schema.org Documentation: https://schema.org/docs/schemas.html
- Google Search Documentation: https://developers.google.com/search

**Verification Commands:**
```bash
# Quick test suite
curl https://www.aipropertywriter.com/robots.txt
curl https://www.aipropertywriter.com/sitemap.xml | head -50
curl -s https://www.aipropertywriter.com | grep canonical
curl -s https://www.aipropertywriter.com | grep "application/ld+json" -A 30
```

---

Last Updated: December 2025
Site: https://www.aipropertywriter.com
Framework: Next.js 14 (App Router)
Hosting: Vercel
