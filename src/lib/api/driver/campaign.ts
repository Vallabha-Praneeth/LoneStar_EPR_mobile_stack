import type { CampaignLifecycleStatus } from '@/lib/campaign-lifecycle';
import { format, subDays } from 'date-fns';
import { deriveCampaignStatus } from '@/lib/campaign-lifecycle';
import { supabase } from '@/lib/supabase';

export type RouteStop = {
  id: string;
  stop_order: number;
  venue_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type DriverCampaignData = {
  id: string;
  title: string;
  campaign_date: string;
  routes: { name: string; route_stops: RouteStop[] } | null;
  status: CampaignLifecycleStatus;
  driver_can_modify_route: boolean;
  driver_shifts: { id: string; started_at: string; ended_at: string | null; shift_stop_completions: { stop_id: string }[] }[];
  campaign_photos: { id: string; submitted_at: string; storage_path: string | null }[];
};

export type PastCampaignRow = {
  id: string;
  title: string;
  campaign_date: string;
  status: CampaignLifecycleStatus;
};

export async function fetchDriverCampaign(driverId: string): Promise<DriverCampaignData | null> {
  const windowStart = format(subDays(new Date(), 14), 'yyyy-MM-dd');
  const { data, error } = await supabase
    .from('campaigns')
    .select(
      'id, title, campaign_date, driver_can_modify_route, routes ( name, route_stops ( id, stop_order, venue_name, address, latitude, longitude ) ), status, driver_shifts ( id, started_at, ended_at, shift_stop_completions ( stop_id ) ), campaign_photos ( id, submitted_at, storage_path )',
    )
    .eq('driver_profile_id', driverId)
    .gte('campaign_date', windowStart)
    .order('campaign_date', { ascending: true })
    .limit(25);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  function normalizeCampaign(raw: Record<string, unknown>): DriverCampaignData {
    const routesRaw = raw.routes;
    const routesObj: Record<string, unknown> | null = Array.isArray(routesRaw)
      ? (routesRaw[0] ?? null)
      : ((routesRaw as Record<string, unknown> | null) ?? null);

    let normalizedRoutes: DriverCampaignData['routes'] = null;
    if (routesObj) {
      const stopsRaw = routesObj.route_stops;
      const stops: RouteStop[] = (Array.isArray(stopsRaw) ? stopsRaw : []) as RouteStop[];
      normalizedRoutes = {
        name: routesObj.name as string,
        route_stops: stops.sort((a, b) => a.stop_order - b.stop_order),
      };
    }

    const shifts = (raw.driver_shifts ?? []) as DriverCampaignData['driver_shifts'];

    return {
      id: raw.id as string,
      title: raw.title as string,
      campaign_date: raw.campaign_date as string,
      status: deriveCampaignStatus({
        campaignDate: raw.campaign_date as string,
        rawStatus: raw.status as string,
        shifts,
      }),
      driver_can_modify_route: Boolean(raw.driver_can_modify_route ?? false),
      routes: normalizedRoutes,
      driver_shifts: shifts,
      campaign_photos: (raw.campaign_photos ?? []) as DriverCampaignData['campaign_photos'],
    };
  }

  const campaigns = (data as Record<string, unknown>[]).map(normalizeCampaign);
  const priority = new Map<CampaignLifecycleStatus, number>([
    ['active', 0],
    ['overdue', 1],
    ['pending', 2],
    ['draft', 3],
    ['completed', 4],
  ]);
  const actionable = campaigns
    .filter(campaign => campaign.status !== 'completed')
    .sort((left, right) => {
      const priorityDiff = (priority.get(left.status) ?? 99) - (priority.get(right.status) ?? 99);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      if (left.status === 'overdue' && right.status === 'overdue') {
        return right.campaign_date.localeCompare(left.campaign_date);
      }
      return left.campaign_date.localeCompare(right.campaign_date);
    });

  return actionable[0] ?? null;
}

export async function getPhotoSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('campaign-photos')
    .createSignedUrl(storagePath, 3600);
  if (error)
    return null;
  return data.signedUrl;
}

export async function fetchDriverPastCampaigns(driverId: string): Promise<PastCampaignRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, title, campaign_date, status, driver_shifts ( started_at, ended_at )')
    .eq('driver_profile_id', driverId)
    .lt('campaign_date', today)
    .order('campaign_date', { ascending: false })
    .limit(20);
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
  }));
}

/**
 * Creates a shift row and returns its id.
 * Uses `.select('id').single()` so callers get the id without a follow-up query.
 * Requires RLS to allow SELECT on the inserted `driver_shifts` row for the driver
 * (standard PostgREST “returning representation” pattern).
 */
export async function startShift(campaignId: string, driverId: string): Promise<string> {
  const { data, error } = await supabase
    .from('driver_shifts')
    .insert({
      campaign_id: campaignId,
      driver_profile_id: driverId,
      started_at: new Date().toISOString(),
      shift_status: 'active',
    })
    .select('id')
    .single();

  if (error)
    throw error;
  if (!data?.id)
    throw new Error('Shift started but no id was returned.');
  return data.id;
}

export async function endShift(shiftId: string): Promise<void> {
  const { error } = await supabase
    .from('driver_shifts')
    .update({ ended_at: new Date().toISOString(), shift_status: 'completed' })
    .eq('id', shiftId);
  if (error)
    throw error;
}
