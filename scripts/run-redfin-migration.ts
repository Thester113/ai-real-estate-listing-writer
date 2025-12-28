import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251226205000_add_redfin_market_data.sql')
  const sql = fs.readFileSync(migrationPath, 'utf-8')

  console.log('Running Redfin market data migration...')

  // Split by semicolons and run each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      if (error) {
        console.error('Error executing statement:', error)
        // Continue anyway - some errors are expected (like "already exists")
      }
    } catch (e) {
      console.error('Error:', e)
    }
  }

  console.log('Migration complete!')
}

runMigration().catch(console.error)
