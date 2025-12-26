#!/usr/bin/env tsx

/**
 * Script to generate AI-powered blog posts
 * Run with: npx tsx scripts/generate-blog-posts.ts
 */

// Polyfill fetch for Node.js environment
import fetch from 'node-fetch'
// @ts-ignore
global.fetch = fetch

// Use production URL by default, fallback to localhost for local development
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.aipropertywriter.com';

const blogTopics = [
  {
    title: "5 Essential Elements of High-Converting Real Estate Listings",
    keywords: ["real estate listings", "high-converting", "property descriptions", "listing optimization", "real estate marketing"],
    category: "Tips & Strategies",
    author: "Sarah Johnson"
  },
  {
    title: "How AI is Revolutionizing Real Estate Marketing",
    keywords: ["AI real estate", "marketing automation", "artificial intelligence", "property marketing", "real estate technology"],
    category: "Industry Insights",
    author: "Mike Chen"
  },
  {
    title: "Writing Property Descriptions That Sell: A Complete Guide",
    keywords: ["property descriptions", "copywriting", "real estate writing", "listing copy", "selling homes"],
    category: "Writing Tips",
    author: "Lisa Rodriguez"
  },
  {
    title: "The Psychology Behind Effective Real Estate Copy",
    keywords: ["buyer psychology", "persuasive copy", "emotional triggers", "real estate psychology", "copywriting psychology"],
    category: "Psychology",
    author: "David Thompson"
  },
  {
    title: "SEO Best Practices for Real Estate Listings in 2025",
    keywords: ["real estate SEO", "search optimization", "listing visibility", "SEO strategy", "Google rankings"],
    category: "SEO & Marketing",
    author: "Emma Wilson"
  },
  {
    title: "Common Mistakes in Real Estate Descriptions and How to Avoid Them",
    keywords: ["listing mistakes", "real estate errors", "description tips", "avoid mistakes", "listing best practices"],
    category: "Best Practices",
    author: "Alex Martinez"
  }
];

async function generateBlogPost(topic: typeof blogTopics[0]) {
  console.log(`\n📝 Generating: ${topic.title}`);
  console.log(`   Category: ${topic.category}`);
  console.log(`   Author: ${topic.author}`);

  try {
    const response = await fetch(`${API_URL}/api/admin/generate-blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(topic)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    if (result.success) {
      console.log(`   ✅ Generated successfully!`);
      console.log(`   📖 Slug: ${result.data.slug}`);
      console.log(`   ⏱️  Read time: ${result.data.readTime}`);
      return result.data;
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    console.error(`   ❌ Failed:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting blog post generation...');
  console.log(`📡 API URL: ${API_URL}`);
  console.log(`📚 Total posts to generate: ${blogTopics.length}\n`);

  const results = [];

  for (let i = 0; i < blogTopics.length; i++) {
    const topic = blogTopics[i];

    try {
      const result = await generateBlogPost(topic);
      results.push({ success: true, ...result });

      // Add delay between requests to avoid rate limiting
      if (i < blogTopics.length - 1) {
        console.log('   ⏳ Waiting 2 seconds before next generation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      results.push({
        success: false,
        title: topic.title,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Continue with next post even if one fails
      console.log('   ⏩ Continuing with next post...');
      if (i < blogTopics.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Successful: ${successful.length}/${blogTopics.length}`);
  if (successful.length > 0) {
    successful.forEach(r => {
      console.log(`   • ${r.title || 'Untitled'} → /${r.slug}`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${blogTopics.length}`);
    failed.forEach(r => {
      console.log(`   • ${r.title}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Blog generation complete!');
  console.log('🌐 Visit your blog at: ' + API_URL + '/blog');
  console.log('='.repeat(60) + '\n');
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
