import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

type UploadPhotoOptions = {
  imageUri: string;
  campaignId: string;
  driverId: string;
  note: string;
};

export async function uploadPhoto({
  imageUri,
  campaignId,
  driverId,
  note,
}: UploadPhotoOptions): Promise<string> {
  // Validate file size before uploading
  const response = await fetch(imageUri);
  const blob = await response.blob();

  if (blob.size > MAX_FILE_SIZE) {
    throw new Error('File size must be under 15 MB.');
  }

  // ArrayBuffer is the correct upload pattern for React Native
  const arrayBuffer = await new Response(blob).arrayBuffer();

  const photoId = Crypto.randomUUID();
  const storagePath = `campaigns/${campaignId}/photos/${photoId}/original.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('campaign-photos')
    .upload(storagePath, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError)
    throw uploadError;

  const { error: insertError } = await supabase.from('campaign_photos').insert({
    id: photoId,
    campaign_id: campaignId,
    uploaded_by: driverId,
    storage_path: storagePath,
    note: note.trim() || null,
    submitted_at: new Date().toISOString(),
    captured_at: new Date().toISOString(),
  });

  if (insertError) {
    // Orphan cleanup — remove storage object if DB insert fails
    await supabase.storage.from('campaign-photos').remove([storagePath]);
    throw insertError;
  }

  return photoId;
}
