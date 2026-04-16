import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

type UploadPhotoOptions = {
  imageUri: string;
  campaignId: string;
  driverId: string;
  note: string;
  /** When set, photo is stored under campaigns/{id}/stops/{stopId}/ and linked in DB */
  stopId?: string;
};

export async function uploadPhoto({
  imageUri,
  campaignId,
  driverId,
  note,
  stopId,
}: UploadPhotoOptions): Promise<string> {
  const response = await fetch(imageUri);
  const blob = await response.blob();

  if (blob.size > MAX_FILE_SIZE) {
    throw new Error('File size must be under 15 MB.');
  }

  const arrayBuffer = await new Response(blob).arrayBuffer();
  const photoId = Crypto.randomUUID();

  // Organise storage by stop when context is available, else flat photos folder
  const storagePath = stopId
    ? `campaigns/${campaignId}/stops/${stopId}/${photoId}.jpg`
    : `campaigns/${campaignId}/photos/${photoId}/original.jpg`;

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
    // Linked to stop — requires migration 008_stop_photo_organisation.sql
    ...(stopId ? { route_stop_id: stopId } : {}),
  });

  if (insertError) {
    await supabase.storage.from('campaign-photos').remove([storagePath]);
    throw insertError;
  }

  return photoId;
}

/**
 * Records a driver marking a stop as done during a shift.
 * Requires migration 008_stop_photo_organisation.sql (shift_stop_completions table).
 * Silently ignores duplicate completions (UNIQUE constraint).
 */
export async function completeStop(
  shiftId: string,
  stopId: string,
  coord?: [number, number],
): Promise<void> {
  const { error } = await supabase
    .from('shift_stop_completions')
    .insert({
      shift_id: shiftId,
      stop_id: stopId,
      // Record driver position at completion time for authenticity auditing
      // (mirrors the photo-metadata GPS verification approach)
      ...(coord != null ? { completed_lng: coord[0], completed_lat: coord[1] } : {}),
    })
    .select()
    .maybeSingle();

  // Ignore unique-constraint violation (already completed) gracefully
  if (error && error.code !== '23505')
    throw error;
}
