#!/usr/bin/env node

import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';
const MOCK_AI = process.env.MOCK_AI === '1';

console.log('🧪 Running smoke tests...');
console.log(`Target: ${TARGET_URL}`);
console.log(`Mock AI: ${MOCK_AI ? 'enabled' : 'disabled'}`);
console.log('========================');

let failures = 0;

async function test(name, testFn) {
  try {
    console.log(`🔍 ${name}...`);
    await testFn();
    console.log(`✅ ${name} passed`);
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.message);
    failures++;
  }
}

async function checkEndpoint(path, expectedStatus = 200, expectedContent = null) {
  const response = await fetch(`${TARGET_URL}${path}`);
  
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
  }
  
  const text = await response.text();
  
  if (expectedContent && !text.includes(expectedContent)) {
    throw new Error(`Response doesn't contain expected content: ${expectedContent}`);
  }
  
  return { response, text };
}

// Test 1: Homepage loads
await test('Homepage loads', async () => {
  await checkEndpoint('/', 200, 'AI Real Estate Listing Writer');
});

// Test 2: Health check endpoint
await test('Health check', async () => {
  await checkEndpoint('/api/health', 200, 'ok');
});

// Test 3: Blog page loads
await test('Blog page loads', async () => {
  await checkEndpoint('/blog', 200);
});

// Test 4: API endpoint security headers
await test('API security headers', async () => {
  const { response } = await checkEndpoint('/api/health');
  const headers = response.headers;
  
  if (!headers.get('x-content-type-options')) {
    throw new Error('Missing X-Content-Type-Options header');
  }
  
  if (!headers.get('x-frame-options')) {
    throw new Error('Missing X-Frame-Options header');
  }
});

// Test 5: Generate listing endpoint (if not in production)
if (MOCK_AI) {
  await test('Generate listing endpoint (mocked)', async () => {
    const response = await fetch(`${TARGET_URL}/api/generate/listing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 2,
        features: ['pool', 'garage'],
        location: 'Suburban neighborhood',
        targetAudience: 'families'
      })
    });
    
    if (response.status === 401) {
      // Expected if not authenticated
      return;
    }
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
  });
}

// Test 6: Stripe webhook endpoint rejects invalid requests
await test('Stripe webhook security', async () => {
  const response = await fetch(`${TARGET_URL}/api/stripe/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ test: 'data' })
  });
  
  // Should reject without proper signature
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }
});

// Test 7: Environment variables are properly set (in CI)
if (process.env.CI) {
  await test('Required environment variables', async () => {
    const envPath = '.env.local';
    
    if (!existsSync(envPath)) {
      // In CI, check that deployment has required vars
      const response = await fetch(`${TARGET_URL}/api/health`);
      if (!response.ok) {
        throw new Error('Health check failed - environment may be misconfigured');
      }
      return;
    }
    
    const envContent = await readFile(envPath, 'utf8');
    const required = [
      'OPENAI_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'STRIPE_SECRET_KEY'
    ];
    
    for (const key of required) {
      if (!envContent.includes(`${key}=`)) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
  });
}

// Test 8: Sitemap exists and is valid
await test('Sitemap generation', async () => {
  const { response } = await checkEndpoint('/sitemap.xml', 200);
  const text = await response.text();
  
  if (!text.includes('<?xml') || !text.includes('<urlset')) {
    throw new Error('Invalid sitemap format');
  }
});

// Test 9: Robots.txt exists
await test('Robots.txt', async () => {
  await checkEndpoint('/robots.txt', 200, 'User-agent');
});

console.log('\n📊 Smoke Test Results');
console.log('====================');

if (failures === 0) {
  console.log('🎉 All smoke tests passed!');
  process.exit(0);
} else {
  console.log(`💥 ${failures} test(s) failed`);
  process.exit(1);
}