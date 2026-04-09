import { createClient } from '@supabase/supabase-js';
/**
 * Reset test data after Maestro E2E runs.
 * Runs via: npx tsx scripts/reset-test-data.ts
 */
import 'dotenv/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, serviceKey || anonKey);

const ADMIN_EMAIL = 'admin@adtruck.com';
const ADMIN_PASSWORD = 'mawqex-rYsneq-kynja5';
const CAMPAIGN_ID = '00000000-0000-0000-0000-000000000010';

const today = new Date().toISOString().slice(0, 10);

async function reset() {
  if (!serviceKey) {
    console.log('Signing in as admin...');
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    if (authErr)
      throw new Error(`Admin sign-in failed: ${authErr.message}`);
  }

  console.log('Resetting test data...');

  // 1. Delete test photos
  const { error: e1 } = await supabase
    .from('campaign_photos')
    .delete()
    .eq('campaign_id', CAMPAIGN_ID);
  if (e1)
    console.warn('campaign_photos:', e1.message);

  // 2. Delete test shifts
  const { error: e2 } = await supabase
    .from('driver_shifts')
    .delete()
    .eq('campaign_id', CAMPAIGN_ID);
  if (e2)
    console.warn('driver_shifts:', e2.message);

  // 3. Reset campaign to active + today
  const { error: e3 } = await supabase
    .from('campaigns')
    .update({ status: 'active', campaign_date: today })
    .eq('id', CAMPAIGN_ID);
  if (e3)
    console.warn('campaigns:', e3.message);

  console.log('Reset complete.');
}

reset().catch((err) => {
  console.error('Reset failed:', err.message);
  process.exit(1);
});
