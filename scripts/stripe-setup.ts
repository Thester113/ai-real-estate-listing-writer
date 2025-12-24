#!/usr/bin/env tsx

import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

interface PriceInfo {
  id: string;
  amount: number;
  nickname: string;
}

async function updateEnvFile(key: string, value: string) {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found. Please create it first.');
    process.exit(1);
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
  } else {
    envContent += `\n${key}=${value}`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated ${key} in .env.local`);
}

async function createProduct(): Promise<Stripe.Product> {
  console.log('🔍 Checking for existing product...');
  
  const existingProducts = await stripe.products.list({
    limit: 100,
  });
  
  const existingProduct = existingProducts.data.find(
    p => p.name === 'AI Real Estate Listing Writer'
  );
  
  if (existingProduct) {
    console.log('✅ Found existing product:', existingProduct.id);
    return existingProduct;
  }
  
  console.log('🆕 Creating new product...');
  const product = await stripe.products.create({
    name: 'AI Real Estate Listing Writer',
    description: 'AI-powered real estate listing generation service',
    metadata: {
      service: 'listing-writer',
      version: '1.0'
    }
  });
  
  console.log('✅ Created product:', product.id);
  return product;
}

async function createPrice(
  productId: string,
  amount: number,
  nickname: string
): Promise<PriceInfo> {
  console.log(`🔍 Checking for existing ${nickname} price...`);
  
  const existingPrices = await stripe.prices.list({
    product: productId,
    limit: 100,
  });
  
  const existingPrice = existingPrices.data.find(
    p => p.nickname === nickname && p.unit_amount === amount
  );
  
  if (existingPrice) {
    console.log(`✅ Found existing ${nickname} price:`, existingPrice.id);
    return {
      id: existingPrice.id,
      amount,
      nickname
    };
  }
  
  console.log(`🆕 Creating ${nickname} price...`);
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    nickname,
    metadata: {
      plan: nickname.toLowerCase(),
    }
  });
  
  console.log(`✅ Created ${nickname} price:`, price.id);
  return {
    id: price.id,
    amount,
    nickname
  };
}

async function main() {
  console.log('🔧 Setting up Stripe products and prices...');
  console.log('==========================================');
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
    process.exit(1);
  }
  
  try {
    // Create or find product
    const product = await createProduct();
    
    // Create or find prices
    const starterPrice = await createPrice(product.id, 1900, 'Starter'); // $19.00
    const proPrice = await createPrice(product.id, 3900, 'Pro'); // $39.00
    
    // Update environment file
    await updateEnvFile('STRIPE_PRICE_ID_STARTER', starterPrice.id);
    await updateEnvFile('STRIPE_PRICE_ID_PRO', proPrice.id);
    
    console.log('\n🎉 Stripe setup complete!');
    console.log('=========================');
    console.log(`📦 Product ID: ${product.id}`);
    console.log(`💰 Starter Price ID: ${starterPrice.id} ($${starterPrice.amount / 100}/month)`);
    console.log(`💎 Pro Price ID: ${proPrice.id} ($${proPrice.amount / 100}/month)`);
    console.log('\n📝 Price IDs have been saved to .env.local');
    console.log('\n⚠️  Next Steps:');
    console.log('   1. Set up webhook endpoint in Stripe Dashboard');
    console.log('   2. Add webhook signing secret to environment variables');
    
  } catch (error) {
    console.error('❌ Error setting up Stripe:', error);
    process.exit(1);
  }
}

main().catch(console.error);