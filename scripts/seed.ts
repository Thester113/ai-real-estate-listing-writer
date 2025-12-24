#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...');
  
  try {
    // Create a test user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@example.com',
        full_name: 'Test User',
        plan: 'starter',
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating test profile:', profileError);
    } else {
      console.log('✅ Created test user profile');
    }

    // Create sample blog post
    const { error: blogError } = await supabase
      .from('blog_posts')
      .upsert({
        title: 'How AI is Revolutionizing Real Estate Listings',
        slug: 'ai-real-estate-listings',
        excerpt: 'Discover how artificial intelligence is transforming the way we write property descriptions.',
        content: `
# How AI is Revolutionizing Real Estate Listings

The real estate industry is experiencing a digital transformation, and artificial intelligence is at the forefront of this change. Gone are the days of struggling to find the right words to describe a property or spending hours crafting the perfect listing description.

## The Challenge of Traditional Listing Writing

Writing compelling real estate listings has always been both an art and a science. Agents need to:

- Highlight key features without being overly salesy
- Appeal to the target demographic
- Include essential details while maintaining readability
- Create emotional connection with potential buyers

## How AI Changes the Game

Our AI-powered listing writer addresses these challenges by:

### 1. Intelligent Feature Analysis
The AI analyzes property details and automatically identifies the most compelling selling points based on market data and buyer preferences.

### 2. Demographic Targeting
By understanding your target market, the AI adjusts tone, vocabulary, and emphasis to resonate with specific buyer personas.

### 3. SEO Optimization
Every listing is optimized for search engines, helping your properties get discovered by more potential buyers online.

## Getting Started

Ready to transform your listing process? Our AI tool makes it simple:

1. Input basic property details
2. Specify your target audience
3. Review and customize the generated content
4. Publish with confidence

The future of real estate marketing is here, and it's powered by AI.
        `,
        published: true,
        published_at: new Date().toISOString(),
        seo_title: 'AI Real Estate Listings - Transform Your Property Descriptions',
        seo_description: 'Learn how AI is revolutionizing real estate listings with automated, compelling property descriptions that convert.',
        tags: ['AI', 'Real Estate', 'Technology', 'Marketing']
      });

    if (blogError) {
      console.error('Error creating blog post:', blogError);
    } else {
      console.log('✅ Created sample blog post');
    }

    // Create sample generation
    const { error: genError } = await supabase
      .from('generations')
      .upsert({
        user_id: '00000000-0000-0000-0000-000000000001',
        prompt: 'Modern 3-bedroom house with pool in suburban neighborhood',
        result: {
          title: 'Stunning Modern Home with Resort-Style Pool',
          description: 'Welcome to this beautifully designed 3-bedroom home featuring an open-concept layout, gourmet kitchen with granite countertops, and a resort-style swimming pool perfect for entertaining. Located in a quiet suburban neighborhood with top-rated schools nearby.',
          highlights: [
            'Open-concept living space',
            'Gourmet kitchen with granite counters',
            'Resort-style swimming pool',
            'Quiet suburban location',
            'Top-rated school district'
          ]
        },
        word_count: 47,
        metadata: {
          bedrooms: 3,
          type: 'house',
          features: ['pool', 'modern', 'suburban']
        }
      });

    if (genError) {
      console.error('Error creating sample generation:', genError);
    } else {
      console.log('✅ Created sample generation');
    }

    // Update usage for the test user
    const { error: usageError } = await supabase.rpc('increment_usage', {
      user_uuid: '00000000-0000-0000-0000-000000000001',
      listings_delta: 1,
      words_delta: 47
    });

    if (usageError) {
      console.error('Error updating usage:', usageError);
    } else {
      console.log('✅ Updated usage statistics');
    }

    console.log('\n🎉 Database seeding complete!');
    console.log('================================');
    console.log('Test user: test@example.com');
    console.log('Sample blog post: /blog/ai-real-estate-listings');
    console.log('Sample generation created with usage tracking');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase().catch(console.error);