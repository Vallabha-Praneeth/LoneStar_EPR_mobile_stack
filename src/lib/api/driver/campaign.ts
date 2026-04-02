import { supabase } from '@/lib/supabase';

export type DriverCampaignData = {
  id: string;
  title: string;
  campaign_date: string;
  routes: { name: string } | null;
  status: 'draft' | 'pending' | 'active' | 'completed';
  driver_shifts: { id: string; started_at: string; ended_at: string | null }[];
  campaign_photos: { id: string; submitted_at: string }[];
};

export async function fetchDriverCampaign(driverId: string): Promise<DriverCampaignData | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('campaigns')
    .select(
      'id, title, campaign_date, status, routes:route_id ( name ), driver_shifts ( id, started_at, ended_at ), campaign_photos ( id, submitted_at )',
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
  return data as unknown as DriverCampaignData;
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
