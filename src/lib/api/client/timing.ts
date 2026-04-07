import { supabase } from '@/lib/supabase';

export type ClientTimingShiftRow = {
  shiftId: string;
  started_at: string;
  ended_at: string | null;
  first_photo_at: string | null;
  campaign: { id: string; title: string; campaign_date: string };
};

function shiftDurationMins(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

export function formatDurationMins(totalMins: number): string {
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs > 0)
    return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export async function fetchClientTimingShifts(clientId: string): Promise<ClientTimingShiftRow[]> {
  const { data: campaigns, error: campErr } = await supabase
    .from('campaigns')
    .select('id, title, campaign_date')
    .eq('client_id', clientId)
    .order('campaign_date', { ascending: false });

  if (campErr)
    throw campErr;

  const rows: ClientTimingShiftRow[] = [];

  for (const c of campaigns ?? []) {
    const { data: shifts, error: shiftErr } = await supabase
      .from('driver_shifts')
      .select('id, started_at, ended_at')
      .eq('campaign_id', c.id)
      .order('started_at', { ascending: true });

    if (shiftErr)
      throw shiftErr;

    const { data: firstPhoto } = await supabase
      .from('campaign_photos')
      .select('submitted_at')
      .eq('campaign_id', c.id)
      .order('submitted_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const firstAt = firstPhoto?.submitted_at ?? null;

    for (const s of shifts ?? []) {
      rows.push({
        shiftId: s.id,
        started_at: s.started_at,
        ended_at: s.ended_at,
        first_photo_at: firstAt,
        campaign: { id: c.id, title: c.title, campaign_date: c.campaign_date },
      });
    }
  }

  return rows;
}

export function hoursForShift(startedAt: string, endedAt: string | null): string | null {
  if (!endedAt)
    return null;
  return formatDurationMins(shiftDurationMins(startedAt, endedAt));
}
