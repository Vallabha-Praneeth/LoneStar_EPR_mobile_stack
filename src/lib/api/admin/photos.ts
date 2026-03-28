import { supabase } from '@/lib/supabase';

export type PhotoRow = {
  id: string;
  storage_path: string;
  note: string | null;
  submitted_at: string;
};

export async function fetchCampaignPhotos(campaignId: string): Promise<PhotoRow[]> {
  const { data, error } = await supabase
    .from('campaign_photos')
    .select('id, storage_path, note, submitted_at')
    .eq('campaign_id', campaignId)
    .order('submitted_at', { ascending: true });

  if (error)
    throw error;
  return (data ?? []) as PhotoRow[];
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('campaign-photos')
    .createSignedUrl(storagePath, 3600);

  if (error)
    throw error;
  return data.signedUrl;
}

export async function deletePhoto(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from('campaign-photos').remove([storagePath]);
  const { error } = await supabase.from('campaign_photos').delete().eq('id', id);
  if (error)
    throw error;
}
