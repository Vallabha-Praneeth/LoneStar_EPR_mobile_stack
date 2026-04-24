import { supabase } from '@/lib/supabase';

export type ClientOption = {
  id: string;
  name: string;
};

export type DriverOption = {
  id: string;
  display_name: string;
};

export type CampaignOption = {
  id: string;
  title: string;
  client_id: string;
  driver_profile_id: string | null;
  campaign_date: string;
  driver_shifts: { driver_profile_id: string | null }[];
};

export async function fetchClients(): Promise<ClientOption[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .order('name');

  if (error)
    throw error;
  return (data ?? []) as ClientOption[];
}

export async function fetchDrivers(): Promise<DriverOption[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('role', 'driver')
    .eq('is_active', true)
    .order('display_name');

  if (error)
    throw error;
  return (data ?? []) as DriverOption[];
}

export async function fetchCampaignOptions(): Promise<CampaignOption[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, title, client_id, driver_profile_id, campaign_date, driver_shifts ( driver_profile_id )')
    .order('campaign_date', { ascending: false });

  if (error)
    throw error;

  return (data ?? []) as CampaignOption[];
}
