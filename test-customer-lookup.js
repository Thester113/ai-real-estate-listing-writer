// Quick test to check if the customer ID exists in database
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.log('SUPABASE_URL present:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_KEY present:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCustomerLookup() {
  const customerId = 'cus_TfgMZPqNV5AsCW'
  
  console.log('🔍 Testing customer lookup for:', customerId)
  
  // Test direct customer_id lookup
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('*')
    .eq('customer_id', customerId)
    .single()

  console.log('👤 Direct lookup result:', {
    found: !!profile,
    error: findError?.message,
    customerId: profile?.customer_id,
    email: profile?.email,
    currentPlan: profile?.plan,
    subscriptionStatus: profile?.subscription_status,
    subscriptionId: profile?.subscription_id
  })
  
  if (!profile) {
    // Test lookup by email if we can find the customer email
    console.log('❌ Direct lookup failed, testing email lookup...')
    
    // In a real scenario, we'd get email from Stripe
    // For now, let's see all profiles to understand the data
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('customer_id, email, plan, subscription_status')
      .limit(5)
    
    console.log('📊 Sample profiles:', allProfiles)
  }
}

testCustomerLookup().catch(console.error)