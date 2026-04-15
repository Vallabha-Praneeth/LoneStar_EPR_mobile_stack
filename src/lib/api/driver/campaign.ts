import { supabase } from '@/lib/supabase';

export type RouteStop = {
  id: string;
  stop_order: number;
  venue_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type DriverCampaignData = {
  id: string;
  title: string;
  campaign_date: string;
  routes: { name: string; route_stops: RouteStop[] } | null;
  status: 'draft' | 'pending' | 'active' | 'completed';
  driver_shifts: { id: string; started_at: string; ended_at: string | null; shift_stop_completions: { stop_id: string }[] }[];
  campaign_photos: { id: string; submitted_at: string; storage_path: string | null }[];
};

export type PastCampaignRow = {
  id: string;
  title: string;
  campaign_date: string;
  status: string;
};

export async function fetchDriverCampaign(driverId: string): Promise<DriverCampaignData | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('campaigns')
    .select(
      'id, title, campaign_date, routes ( name, route_stops ( id, stop_order, venue_name, address, latitude, longitude ) ), status, driver_shifts ( id, started_at, ended_at, shift_stop_completions ( stop_id ) ), campaign_photos ( id, submitted_at, storage_path )',
    )
    .eq('driver_profile_id', driverId)
    .gte('campaign_date', today)
    .order('campaign_date', { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116')
      return null;
    throw error;
  }

  // Supabase joins can return an object or an array depending on the FK
  // relationship detection. Normalize to match DriverCampaignData.
  const raw = data as Record<string, unknown>;
  const routesRaw = raw.routes;
  const routesObj: Record<string, unknown> | null = Array.isArray(routesRaw)
    ? (routesRaw[0] ?? null)
    : ((routesRaw as Record<string, unknown> | null) ?? null);

  let normalizedRoutes: DriverCampaignData['routes'] = null;
  if (routesObj) {
    const stopsRaw = routesObj.route_stops;
    const stops: RouteStop[] = (Array.isArray(stopsRaw) ? stopsRaw : []) as RouteStop[];
    normalizedRoutes = {
      name: routesObj.name as string,
      route_stops: stops.sort((a, b) => a.stop_order - b.stop_order),
    };
  }

  return {
    id: raw.id as string,
    title: raw.title as string,
    campaign_date: raw.campaign_date as string,
    status: raw.status as DriverCampaignData['status'],
    routes: normalizedRoutes,
    driver_shifts: (raw.driver_shifts ?? []) as DriverCampaignData['driver_shifts'],
    campaign_photos: (raw.campaign_photos ?? []) as DriverCampaignData['campaign_photos'],
  };
}

export async function getPhotoSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('campaign-photos')
    .createSignedUrl(storagePath, 3600);
  if (error)
    return null;
  return data.signedUrl;
}

export async function fetchDriverPastCampaigns(driverId: string): Promise<PastCampaignRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, title, campaign_date, status')
    .eq('driver_profile_id', driverId)
    .lt('campaign_date', today)
    .order('campaign_date', { ascending: false })
    .limit(20);
  if (error)
    throw error;
  return data ?? [];
}

/**
 * Creates a shift row and returns its id.
 * Uses `.select('id').single()` so callers get the id without a follow-up query.
 * Requires RLS to allow SELECT on the inserted `driver_shifts` row for the driver
 * (standard PostgREST “returning representation” pattern).
 */
export async function startShift(campaignId: string, driverId: string): Promise<string> {
  const { data, error } = await supabase
    .from('driver_shifts')
    .insert({
      campaign_id: campaignId,
      driver_profile_id: driverId,
      started_at: new Date().toISOString(),
      shift_status: 'active',
    })
    .select('id')
    .single();

  if (error)
    throw error;
  if (!data?.id)
    throw new Error('Shift started but no id was returned.');
  return data.id;
}

export async function endShift(shiftId: string): Promise<void> {
  const { error } = await supabase
    .from('driver_shifts')
    .update({ ended_at: new Date().toISOString(), shift_status: 'completed' })
    .eq('id', shiftId);
  if (error)
    throw error;
}
