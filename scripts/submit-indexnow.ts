import https from 'https';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Configuration
const HOST = 'www.aipropertywriter.com';
const KEY = process.env.INDEXNOW_KEY || '57e0d56f3b694fa9936bca2dba8af782';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// Supabase Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getUrlsToSubmit() {
  const urls = [
    `https://${HOST}/`,
    `https://${HOST}/pricing`,
    `https://${HOST}/blog`,
    `https://${HOST}/ai-listing-guide`,
    `https://${HOST}/seo-checklist`,
    `https://${HOST}/words-that-sell`,
  ];

  // Get recent blog posts (last 7 days)
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('published', true)
    .gt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (posts) {
    posts.forEach(post => {
      urls.push(`https://${HOST}/blog/${post.slug}`);
    });
  }

  return urls;
}

async function submitToIndexNow(urlList: string[]) {
  const data = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urlList,
  });

  const options = {
    hostname: 'api.indexnow.org',
    port: 443,
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': data.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 202) {
          resolve(`✅ Success: Submitted ${urlList.length} URLs to IndexNow`);
        } else {
          reject(`❌ Error: ${res.statusCode} - ${responseBody}`);
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    if (KEY === 'your-indexnow-key') {
      console.warn('⚠️  WARNING: INDEXNOW_KEY env var not set. Please generate a key at https://www.bing.com/indexnow');
      // Continue anyway to show what would happen
    }

    console.log('🔍 Fetching URLs to submit...');
    const urls = await getUrlsToSubmit();
    
    console.log(`🚀 Submitting ${urls.length} URLs to IndexNow...`);
    await submitToIndexNow(urls);
    console.log('Done!');
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

main();
