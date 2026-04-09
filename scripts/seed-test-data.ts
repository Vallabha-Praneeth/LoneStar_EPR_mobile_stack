import { createClient } from '@supabase/supabase-js';
/**
 * Seed test data for Maestro E2E tests.
 * Runs via: npx tsx scripts/seed-test-data.ts
 *
 * Truly idempotent: works on a fresh DB or one with existing data.
 * Signs in as admin (admin RLS allows all writes).
 * If SUPABASE_SERVICE_KEY is set, uses that to bypass RLS.
 */
import 'dotenv/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey || anonKey);

const ADMIN_EMAIL = 'admin@adtruck.com';
const ADMIN_PASSWORD = 'mawqex-rYsneq-kynja5';
const ADMIN_PROFILE_ID = '07b1a667-2738-49a8-b219-589b204d6391';
const DRIVER_PROFILE_ID = '5631663f-2ca2-42d8-9408-720f6b2fb3c7';

const SEED_CLIENT_ID = '00000000-0000-0000-0000-000000000001';
const SEED_ROUTE_ID = '00000000-0000-0000-0000-e2e000000030';
const SEED_ROUTE_STOP_ID = '00000000-0000-0000-0000-e2e000000031';
const SEED_COST_TYPE_ID = '00000000-0000-0000-0000-e2e000000040';
const SEED_DRIVER_ID = '00000000-0000-0000-0000-e2e000000050';
const SEED_CAMPAIGN_ID = '00000000-0000-0000-0000-000000000010';

const today = new Date().toISOString().slice(0, 10);

async function ensureClient(): Promise<string> {
  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .ilike('name', 'Acme Corp')
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase.from('clients').update({ phone_number: '+919059397366' }).eq('id', existing.id);
    console.log('  Client "Acme Corp" exists:', existing.id);
    return existing.id;
  }

  const { error } = await supabase.from('clients').insert({
    id: SEED_CLIENT_ID,
    name: 'Acme Corp',
    phone_number: '+919059397366',
  });
  if (error)
    throw new Error(`clients insert: ${error.message}`);
  console.log('  Created client "Acme Corp"');
  return SEED_CLIENT_ID;
}

async function ensureRoute(): Promise<string> {
  const { data: existing } = await supabase.from('routes').select('id').limit(1).maybeSingle();

  if (existing) {
    console.log('  Using existing route:', existing.id);
    return existing.id;
  }

  const { data: newRoute, error } = await supabase
    .from('routes')
    .insert({ id: SEED_ROUTE_ID, name: 'E2E Test Route', city: 'Dallas', is_active: true })
    .select('id')
    .single();
  if (error)
    throw new Error(`routes insert: ${error.message}`);

  await supabase.from('route_stops').insert({
    id: SEED_ROUTE_STOP_ID,
    route_id: newRoute.id,
    stop_order: 1,
    venue_name: 'Main Street Billboard',
    address: '123 Main St, Dallas TX',
  });
  console.log('  Created route + stop');
  return newRoute.id;
}

async function ensureSupportingRecords() {
  const { data: costType } = await supabase.from('cost_types').select('id').eq('name', 'Driver Wage').maybeSingle();
  if (!costType) {
    await supabase.from('cost_types').insert({ id: SEED_COST_TYPE_ID, name: 'Driver Wage', is_active: true });
    console.log('  Created cost type "Driver Wage"');
  }
  else {
    console.log('  Cost type "Driver Wage" exists');
  }

  const { data: driver } = await supabase.from('drivers').select('id').eq('profile_id', DRIVER_PROFILE_ID).maybeSingle();
  if (!driver) {
    await supabase.from('drivers').insert({
      id: SEED_DRIVER_ID,
      profile_id: DRIVER_PROFILE_ID,
      base_daily_wage: 150.00,
      city: 'Dallas',
      is_active: true,
    });
    console.log('  Created driver record');
  }
  else {
    console.log('  Driver record exists:', driver.id);
  }
}

async function ensureCampaign(clientId: string, routeId: string) {
  const { data: existing } = await supabase.from('campaigns').select('id').eq('id', SEED_CAMPAIGN_ID).maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('campaigns')
      .update({ campaign_date: today, status: 'active', route_id: routeId })
      .eq('id', SEED_CAMPAIGN_ID);
    if (error)
      throw new Error(`campaigns update: ${error.message}`);
    console.log('  Updated campaign to', today);
  }
  else {
    const { error } = await supabase.from('campaigns').insert({
      id: SEED_CAMPAIGN_ID,
      title: 'Acme Corp — E2E Test Campaign',
      campaign_date: today,
      status: 'active',
      client_id: clientId,
      driver_profile_id: DRIVER_PROFILE_ID,
      route_id: routeId,
      client_billed_amount: 500.00,
      created_by: ADMIN_PROFILE_ID,
    });
    if (error)
      throw new Error(`campaigns insert: ${error.message}`);
    console.log('  Created campaign for', today);
  }
}

async function cleanupStaleData() {
  const { count: photosDeleted } = await supabase
    .from('campaign_photos')
    .delete({ count: 'exact' })
    .eq('campaign_id', SEED_CAMPAIGN_ID);

  const { count: shiftsDeleted } = await supabase
    .from('driver_shifts')
    .delete({ count: 'exact' })
    .eq('campaign_id', SEED_CAMPAIGN_ID);

  if (photosDeleted || shiftsDeleted)
    console.log(`  Cleaned up: ${photosDeleted ?? 0} photos, ${shiftsDeleted ?? 0} shifts`);

  // Fix stale "active" shifts on OTHER campaigns for this driver.
  // The unique index driver_shifts_active_shift_idx enforces one active shift
  // per driver globally. Stale shifts block startShift with a constraint violation.
  const { count: staleFixed } = await supabase
    .from('driver_shifts')
    .update({ shift_status: 'completed' }, { count: 'exact' })
    .eq('driver_profile_id', DRIVER_PROFILE_ID)
    .eq('shift_status', 'active');

  if (staleFixed)
    console.log(`  Fixed ${staleFixed} stale active shift(s) on other campaigns`);
}

async function seed() {
  if (!serviceKey) {
    console.log('Signing in as admin...');
    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    if (error)
      throw new Error(`Admin sign-in failed: ${error.message}`);
  }

  console.log('Seeding test data...');

  const clientId = await ensureClient();
  const routeId = await ensureRoute();
  await ensureSupportingRecords();
  await ensureCampaign(clientId, routeId);
  await cleanupStaleData();

  console.log('Seed complete. Campaign date:', today);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
