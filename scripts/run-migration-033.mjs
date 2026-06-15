import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local
const envPath = resolve(import.meta.dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', url)
const supabase = createClient(url, key)

// Check if onboarding columns exist
const { error: checkErr } = await supabase.from('profiles').select('onboarding_step').limit(1)

if (checkErr && checkErr.message.includes('does not exist')) {
  console.log('onboarding_step column does not exist — need to run ALTER TABLE via Supabase Dashboard SQL Editor')
  console.log('')
  console.log('Run this SQL in the Supabase Dashboard SQL Editor:')
  console.log('---')
  console.log(`ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT NOT NULL DEFAULT 'welcome',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

UPDATE profiles
SET onboarding_step = 'ready',
    onboarding_completed_at = NOW()
WHERE onboarding_completed_at IS NULL;`)
  console.log('---')
  process.exit(1)
} else if (checkErr) {
  console.error('Unexpected error:', checkErr.message)
  process.exit(1)
}

console.log('onboarding columns exist! Checking current state...')

// Check which profiles need updating
const { data: profiles, error: fetchErr } = await supabase
  .from('profiles')
  .select('id, display_name, onboarding_step, onboarding_completed_at')

if (fetchErr) {
  console.error('Error fetching profiles:', fetchErr.message)
  process.exit(1)
}

console.log('Profiles:')
for (const p of profiles) {
  console.log(`  ${p.display_name || '(no name)'}: step=${p.onboarding_step}, completed=${p.onboarding_completed_at || 'NULL'}`)
}

// Update all profiles that haven't completed onboarding
const toUpdate = profiles.filter(p => !p.onboarding_completed_at)
if (toUpdate.length === 0) {
  console.log('\nAll profiles already have onboarding completed!')
  process.exit(0)
}

console.log(`\nUpdating ${toUpdate.length} profiles...`)

const { error: updateErr } = await supabase
  .from('profiles')
  .update({ onboarding_step: 'ready', onboarding_completed_at: new Date().toISOString() })
  .is('onboarding_completed_at', null)

if (updateErr) {
  console.error('Error updating:', updateErr.message)
  process.exit(1)
}

console.log('Done! All profiles marked as onboarding-complete.')
