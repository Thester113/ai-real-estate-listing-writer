#!/usr/bin/env tsx

import { writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateSitemap() {
  console.log('🗺️  Generating sitemap...');
  
  const staticPages = [
    '',
    '/pricing',
    '/blog',
    '/privacy',
    '/terms',
    '/dashboard',
  ];
  
  // Get published blog posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('published', true)
    .order('updated_at', { ascending: false });
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${appUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
${posts?.map(post => `  <url>
    <loc>${appUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n') || ''}
</urlset>`;
  
  writeFileSync('public/sitemap.xml', xml);
  console.log(`✅ Sitemap generated with ${staticPages.length + (posts?.length || 0)} pages`);
}

generateSitemap().catch(console.error);