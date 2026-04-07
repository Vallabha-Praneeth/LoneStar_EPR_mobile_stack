import { supabase } from '@/lib/supabase';

export type CampaignRow = {
  id: string;
  title: string;
  campaign_date: string;
  status: 'draft' | 'pending' | 'active' | 'completed';
  clients: { name: string } | null;
  driver_profile: { display_name: string } | null;
};

export type CampaignDetail = {
  id: string;
  title: string;
  campaign_date: string;
  status: 'draft' | 'pending' | 'active' | 'completed';
  route_id: string | null;
  routes: { name: string } | null;
  internal_notes: string | null;
  client_id: string;
  client_billed_amount: number | null;
  driver_profile_id: string | null;
  clients: { name: string } | null;
  driver_profile: { display_name: string } | null;
  driver_shifts: { id: string; started_at: string; ended_at: string | null }[];
  campaign_photos: { id: string; submitted_at: string; note: string | null; storage_path: string }[];
  campaign_costs: { id: string; amount: number; notes: string | null; cost_types: { name: string } | null }[];
};

export type CreateCampaignInput = {
  title: string;
  campaign_date: string;
  client_id: string;
  driver_profile_id: string | null;
  route_id: string | null;
  internal_notes: string | null;
  client_billed_amount: number | null;
  created_by: string;
  status: string;
};

export async function fetchCampaigns(): Promise<CampaignRow[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      id, title, campaign_date, status,
      clients ( name ),
      driver_profile:profiles!driver_profile_id ( display_name )
    `)
    .order('campaign_date', { ascending: false });

  if (error)
    throw error;
  return (data ?? []) as unknown as CampaignRow[];
}

export async function fetchCampaignDetail(id: string): Promise<CampaignDetail> {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      id, title, campaign_date, status, route_id,
      internal_notes, client_billed_amount,
      client_id, driver_profile_id,
      routes ( name ),
      clients ( name ),
      driver_profile:profiles!driver_profile_id ( display_name ),
      driver_shifts ( id, started_at, ended_at ),
      campaign_photos ( id, submitted_at, note, storage_path ),
      campaign_costs ( id, amount, notes, cost_types ( name ) )
    `)
    .eq('id', id)
    .single();

  if (error)
    throw error;
  return data as unknown as CampaignDetail;
}

export async function createCampaign(input: CreateCampaignInput): Promise<string> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert(input)
    .select('id')
    .single();

  if (error)
    throw error;
  return data.id;
}

export async function updateCampaign(id: string, input: Partial<CreateCampaignInput>): Promise<void> {
  const { error } = await supabase
    .from('campaigns')
    .update(input)
    .eq('id', id);

  if (error)
    throw error;
}

export async function deleteCampaign(id: string): Promise<void> {
  // Delete related records first (order matters — FK constraints)
  await supabase.from('campaign_costs').delete().eq('campaign_id', id);
  await supabase.from('campaign_photos').delete().eq('campaign_id', id);
  await supabase.from('driver_shifts').delete().eq('campaign_id', id);
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error)
    throw error;
}

export async function updateCampaignStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('campaigns')
    .update({ status })
    .eq('id', id);

  if (error)
    throw error;
}
