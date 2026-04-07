import { supabase } from '@/lib/supabase';

export type DriverDetailRow = {
  id: string;
  profile_id: string;
  license_number: string | null;
  license_type: string | null;
  license_expiry: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  base_daily_wage: number | null;
  city: string | null;
  profiles: { display_name: string; username: string } | null;
};

export type DriverShiftHistoryRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  campaigns: {
    id: string;
    title: string;
    campaign_date: string;
    driver_daily_wage: number | null;
  } | null;
};

export async function fetchProfileSnippet(profileId: string): Promise<{ display_name: string; username: string }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', profileId)
    .single();
  if (error)
    throw error;
  return data as { display_name: string; username: string };
}

export async function fetchDriverByProfileId(profileId: string): Promise<DriverDetailRow | null> {
  const { data, error } = await supabase
    .from('drivers')
    .select(
      'id, profile_id, license_number, license_type, license_expiry, emergency_contact_name, emergency_contact_phone, base_daily_wage, city, profiles:profile_id ( display_name, username )',
    )
    .eq('profile_id', profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116')
      return null;
    throw error;
  }
  const raw = data as unknown as DriverDetailRow & { profiles?: DriverDetailRow['profiles'] | DriverDetailRow['profiles'][] };
  const p = raw.profiles;
  return {
    ...raw,
    profiles: Array.isArray(p) ? (p[0] ?? null) : (p ?? null),
  };
}

export async function upsertDriverRecord(
  profileId: string,
  existingId: string | null,
  fields: {
    license_number: string | null;
    license_type: string | null;
    license_expiry: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    base_daily_wage: number | null;
    city: string | null;
  },
): Promise<void> {
  if (!existingId) {
    const { error } = await supabase.from('drivers').insert({
      profile_id: profileId,
      ...fields,
    });
    if (error)
      throw error;
    return;
  }
  const { error } = await supabase.from('drivers').update(fields).eq('id', existingId);
  if (error)
    throw error;
}

export async function fetchDriverShiftHistory(profileId: string): Promise<DriverShiftHistoryRow[]> {
  const { data, error } = await supabase
    .from('driver_shifts')
    .select(
      'id, started_at, ended_at, campaigns ( id, title, campaign_date, driver_daily_wage )',
    )
    .eq('driver_profile_id', profileId)
    .order('started_at', { ascending: false });
  if (error)
    throw error;
  type Camp = DriverShiftHistoryRow['campaigns'];
  type Row = {
    id: string;
    started_at: string;
    ended_at: string | null;
    campaigns: Camp | Camp[] | null | undefined;
  };
  return (data ?? []).map((row: Row): DriverShiftHistoryRow => {
    const c = row.campaigns;
    const normalized = Array.isArray(c) ? (c[0] ?? null) : (c ?? null);
    return {
      id: row.id,
      started_at: row.started_at,
      ended_at: row.ended_at,
      campaigns: normalized ?? null,
    };
  });
}
