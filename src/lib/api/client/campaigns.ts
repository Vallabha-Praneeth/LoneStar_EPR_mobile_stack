import type { CampaignLifecycleStatus } from '@/lib/campaign-lifecycle';
import { deriveCampaignStatus } from '@/lib/campaign-lifecycle';
import { supabase } from '@/lib/supabase';

export type ClientCampaignRow = {
  id: string;
  title: string;
  campaign_date: string;
  status: CampaignLifecycleStatus;
  photo_count: number;
  hasActiveShift: boolean;
  activeShiftId: string | null;
};

export type ClientPhotoRow = {
  id: string;
  storage_path: string | null;
  submitted_at: string;
};

export async function fetchClientCampaigns(clientId: string): Promise<ClientCampaignRow[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, title, campaign_date, status, campaign_photos(id), driver_shifts(id, ended_at)')
    .eq('client_id', clientId)
    .order('campaign_date', { ascending: false });

  if (error)
    throw error;

  return (data ?? []).map(row => ({
    id: row.id,
    title: row.title,
    campaign_date: row.campaign_date,
    status: deriveCampaignStatus({
      campaignDate: row.campaign_date as string,
      rawStatus: row.status as string,
      shifts: (row.driver_shifts ?? []) as Array<{ started_at?: string | null; ended_at?: string | null }>,
    }),
    photo_count: Array.isArray(row.campaign_photos) ? row.campaign_photos.length : 0,
    hasActiveShift: (row.driver_shifts ?? []).some((s: { ended_at: string | null }) => !s.ended_at),
    activeShiftId: (row.driver_shifts ?? []).find((s: { id: string; ended_at: string | null }) => !s.ended_at)?.id ?? null,
  }));
}

export async function fetchClientCampaignPhotos(campaignId: string): Promise<ClientPhotoRow[]> {
  const { data, error } = await supabase
    .from('campaign_photos')
    .select('id, storage_path, submitted_at')
    .eq('campaign_id', campaignId)
    .order('submitted_at', { ascending: false });

  if (error)
    throw error;
  return (data ?? []) as ClientPhotoRow[];
}

export async function getClientPhotoSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('campaign-photos')
    .createSignedUrl(storagePath, 3600);
  if (error)
    throw error;
  return data.signedUrl;
}
