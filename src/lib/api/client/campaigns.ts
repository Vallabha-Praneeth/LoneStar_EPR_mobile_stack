import { supabase } from '@/lib/supabase';

export type ClientCampaignRow = {
  id: string;
  title: string;
  campaign_date: string;
  status: 'draft' | 'pending' | 'active' | 'completed';
  photo_count: number;
};

export type ClientPhotoRow = {
  id: string;
  storage_path: string | null;
  submitted_at: string;
};

export async function fetchClientCampaigns(clientId: string): Promise<ClientCampaignRow[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, title, campaign_date, status, campaign_photos(id)')
    .eq('client_id', clientId)
    .order('campaign_date', { ascending: false });

  if (error)
    throw error;

  return (data ?? []).map(row => ({
    id: row.id,
    title: row.title,
    campaign_date: row.campaign_date,
    status: row.status,
    photo_count: Array.isArray(row.campaign_photos) ? row.campaign_photos.length : 0,
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
