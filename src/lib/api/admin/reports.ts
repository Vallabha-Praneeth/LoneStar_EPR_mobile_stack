import { supabase } from '@/lib/supabase';

export type ReportCampaign = {
  id: string;
  title: string;
  campaign_date: string;
  status: string;
  clients: { name: string } | null;
  driver_profile: { display_name: string } | null;
  campaign_photos: { id: string }[];
  driver_shifts: { id: string; started_at: string; ended_at: string | null }[];
};

export async function fetchReportData(): Promise<ReportCampaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      id, title, campaign_date, status,
      clients ( name ),
      driver_profile:profiles!driver_profile_id ( display_name ),
      campaign_photos ( id ),
      driver_shifts ( id, started_at, ended_at )
    `)
    .order('campaign_date', { ascending: false });

  if (error)
    throw error;
  return (data ?? []) as unknown as ReportCampaign[];
}
