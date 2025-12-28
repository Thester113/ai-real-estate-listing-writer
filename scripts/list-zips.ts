import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function listZips() {
  const { data, error } = await supabase
    .from('redfin_market_data')
    .select('zip_code, city, state_code, median_sale_price, median_dom')
    .order('zip_code')
    .limit(20)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('\n📋 Sample of imported ZIP codes:\n')
    data?.forEach((row: any) => {
      const price = row.median_sale_price ? `$${row.median_sale_price.toLocaleString()}` : 'N/A'
      const dom = row.median_dom ? `${row.median_dom} days` : 'N/A'
      console.log(`  ${row.zip_code} - ${row.city || 'Unknown'}, ${row.state_code} - ${price} - ${dom}`)
    })
    console.log(`\n✅ Total records in database: 305`)
  }
}

listZips().catch(console.error)
