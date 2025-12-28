import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkZip() {
  const { data, error } = await supabase
    .from('redfin_market_data')
    .select('*')
    .eq('zip_code', '84005')

  if (error) {
    console.error('Error:', error)
  } else if (data && data.length > 0) {
    console.log(`\n✅ Found ${data.length} records for ZIP 84005:\n`)
    data.forEach((row: any) => {
      const price = row.median_sale_price ? `$${row.median_sale_price.toLocaleString()}` : 'N/A'
      const dom = row.median_dom || 'N/A'
      const yoy = row.median_sale_price_yoy ? (row.median_sale_price_yoy * 100).toFixed(1) + '%' : 'N/A'

      console.log(`  ${row.property_type}:`)
      console.log(`    Median Price: ${price}`)
      console.log(`    Days on Market: ${dom}`)
      console.log(`    YoY Change: ${yoy}`)
      console.log(`    Data from: ${row.period_end}\n`)
    })
  } else {
    console.log('❌ No data found for ZIP 84005')
  }
}

checkZip().catch(console.error)
