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

  const normalize = (val: unknown) =>
    Array.isArray(val) ? (val[0] ?? null) : (val ?? null);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    title: row.title,
    campaign_date: row.campaign_date,
    status: row.status,
    clients: normalize(row.clients),
    driver_profile: normalize(row.driver_profile),
    campaign_photos: (row.campaign_photos ?? []),
    driver_shifts: (row.driver_shifts ?? []),
  })) as ReportCampaign[];
}
