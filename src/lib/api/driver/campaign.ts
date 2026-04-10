import { supabase } from '@/lib/supabase';

export type DriverCampaignData = {
  id: string;
  title: string;
  campaign_date: string;
  routes: { name: string } | null;
  status: 'draft' | 'pending' | 'active' | 'completed';
  driver_shifts: { id: string; started_at: string; ended_at: string | null }[];
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
      'id, title, campaign_date, routes ( name ), status, driver_shifts ( id, started_at, ended_at ), campaign_photos ( id, submitted_at, storage_path )',
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
  const routes = raw.routes;
  const normalizedRoutes = Array.isArray(routes)
    ? (routes[0] ?? null)
    : (routes ?? null);

  return {
    id: raw.id as string,
    title: raw.title as string,
    campaign_date: raw.campaign_date as string,
    status: raw.status as DriverCampaignData['status'],
    routes: normalizedRoutes as DriverCampaignData['routes'],
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

export async function startShift(campaignId: string, driverId: string): Promise<void> {
  const { error } = await supabase.from('driver_shifts').insert({
    campaign_id: campaignId,
    driver_profile_id: driverId,
    started_at: new Date().toISOString(),
    shift_status: 'active',
  });
  if (error)
    throw error;
}

export async function endShift(shiftId: string): Promise<void> {
  const { error } = await supabase
    .from('driver_shifts')
    .update({ ended_at: new Date().toISOString(), shift_status: 'completed' })
    .eq('id', shiftId);
  if (error)
    throw error;
}
