import type { AnalyticsRange } from './types';

import { format, subDays, subMonths, subWeeks, subYears } from 'date-fns';
import { deriveCampaignStatus } from '@/lib/campaign-lifecycle';
import { supabase } from '@/lib/supabase';
import { workedHours } from './calculations';

const TOP_N = 5;

type RawShiftRow = {
  started_at: string;
  ended_at: string | null;
  shift_status: string;
  shift_stop_completions?: { stop_id: string }[];
};

type RawRoleCampaignRow = {
  id: string;
  title: string;
  campaign_date: string;
  status: string;
  campaign_photos: { id: string }[];
  driver_shifts: RawShiftRow[];
};

type RawRoleFilterCampaignRow = {
  id: string;
  title: string;
  client_id: string | null;
  clients: { id: string; name: string } | null;
};

export type DriverAnalyticsFilterOptions = {
  clients: { id: string; name: string }[];
  campaigns: { id: string; title: string; clientId: string | null }[];
};

export type ClientAnalyticsFilterOptions = {
  campaigns: { id: string; title: string }[];
};

export type DriverAnalyticsSummary = {
  totalCampaigns: number;
  activeCampaigns: number;
  totalPhotos: number;
  completedStops: number;
  workedHours: number;
  shiftsWorked: number;
};

export type DriverCampaignBreakdownRow = {
  campaignId: string;
  campaignTitle: string;
  photoCount: number;
  completedStops: number;
  workedHours: number;
};

export type ClientAnalyticsSummary = {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalPhotos: number;
  shiftsObserved: number;
  workedHours: number;
};

export type ClientCampaignBreakdownRow = {
  campaignId: string;
  campaignTitle: string;
  photoCount: number;
  shiftsObserved: number;
  workedHours: number;
};

function getDateRange(range: AnalyticsRange): { from: string; to: string } {
  const to = new Date();
  let from: Date;

  switch (range) {
    case '1d':
      from = subDays(to, 1);
      break;
    case '1w':
      from = subWeeks(to, 1);
      break;
    case '1m':
      from = subMonths(to, 1);
      break;
    case '3m':
      from = subMonths(to, 3);
      break;
    case '6m':
      from = subMonths(to, 6);
      break;
    case '1y':
      from = subYears(to, 1);
      break;
  }

  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  };
}

function summarizeCampaign(row: RawRoleCampaignRow) {
  const photoCount = row.campaign_photos?.length ?? 0;
  const completedStops = (row.driver_shifts ?? []).reduce(
    (sum, shift) => sum + (shift.shift_stop_completions?.length ?? 0),
    0,
  );
  const campaignWorkedHours = (row.driver_shifts ?? []).reduce((sum, shift) => {
    if (!shift.ended_at) {
      return sum;
    }
    return sum + workedHours(shift.started_at, shift.ended_at);
  }, 0);

  return { photoCount, completedStops, campaignWorkedHours };
}

async function fetchRoleCampaigns(
  range: AnalyticsRange,
  filters: { driverId?: string; clientId?: string; campaignId?: string },
): Promise<RawRoleCampaignRow[]> {
  const { from, to } = getDateRange(range);
  let query = supabase
    .from('campaigns')
    .select(`
      id,
      title,
      campaign_date,
      status,
      campaign_photos ( id ),
      driver_shifts ( started_at, ended_at, shift_status, shift_stop_completions ( stop_id ) )
    `)
    .gte('campaign_date', from)
    .lte('campaign_date', to);

  if (filters.driverId) {
    query = query.eq('driver_profile_id', filters.driverId);
  }
  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId);
  }
  if (filters.campaignId) {
    query = query.eq('id', filters.campaignId);
  }

  const { data, error } = await query.order('campaign_date', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as RawRoleCampaignRow[];
}

export async function getDriverAnalyticsSummary(
  driverId: string,
  range: AnalyticsRange,
  filters?: { clientId?: string; campaignId?: string },
): Promise<DriverAnalyticsSummary> {
  const campaigns = await fetchRoleCampaigns(range, {
    driverId,
    clientId: filters?.clientId,
    campaignId: filters?.campaignId,
  });

  let totalPhotos = 0;
  let completedStops = 0;
  let workedHoursTotal = 0;
  let shiftsWorked = 0;
  let activeCampaigns = 0;

  for (const campaign of campaigns) {
    const summary = summarizeCampaign(campaign);
    totalPhotos += summary.photoCount;
    completedStops += summary.completedStops;
    workedHoursTotal += summary.campaignWorkedHours;
    shiftsWorked += campaign.driver_shifts?.length ?? 0;
    if (deriveCampaignStatus({
      campaignDate: campaign.campaign_date,
      rawStatus: campaign.status,
      shifts: campaign.driver_shifts,
    }) === 'active') {
      activeCampaigns++;
    }
  }

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns,
    totalPhotos,
    completedStops,
    workedHours: workedHoursTotal,
    shiftsWorked,
  };
}

export async function getDriverCampaignBreakdown(
  driverId: string,
  range: AnalyticsRange,
  filters?: { clientId?: string; campaignId?: string },
): Promise<DriverCampaignBreakdownRow[]> {
  const campaigns = await fetchRoleCampaigns(range, {
    driverId,
    clientId: filters?.clientId,
    campaignId: filters?.campaignId,
  });

  return campaigns
    .map((campaign) => {
      const summary = summarizeCampaign(campaign);
      return {
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        photoCount: summary.photoCount,
        completedStops: summary.completedStops,
        workedHours: summary.campaignWorkedHours,
      };
    })
    .sort((a, b) => (b.photoCount + b.completedStops) - (a.photoCount + a.completedStops))
    .slice(0, TOP_N);
}

export async function getClientAnalyticsSummary(
  clientId: string,
  range: AnalyticsRange,
  filters?: { campaignId?: string },
): Promise<ClientAnalyticsSummary> {
  const campaigns = await fetchRoleCampaigns(range, {
    clientId,
    campaignId: filters?.campaignId,
  });

  let totalPhotos = 0;
  let shiftsObserved = 0;
  let workedHoursTotal = 0;
  let activeCampaigns = 0;
  let completedCampaigns = 0;

  for (const campaign of campaigns) {
    const summary = summarizeCampaign(campaign);
    totalPhotos += summary.photoCount;
    shiftsObserved += campaign.driver_shifts?.length ?? 0;
    workedHoursTotal += summary.campaignWorkedHours;
    const derivedStatus = deriveCampaignStatus({
      campaignDate: campaign.campaign_date,
      rawStatus: campaign.status,
      shifts: campaign.driver_shifts,
    });
    if (derivedStatus === 'active') {
      activeCampaigns++;
    }
    if (derivedStatus === 'completed') {
      completedCampaigns++;
    }
  }

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns,
    completedCampaigns,
    totalPhotos,
    shiftsObserved,
    workedHours: workedHoursTotal,
  };
}

export async function getClientCampaignBreakdown(
  clientId: string,
  range: AnalyticsRange,
  filters?: { campaignId?: string },
): Promise<ClientCampaignBreakdownRow[]> {
  const campaigns = await fetchRoleCampaigns(range, {
    clientId,
    campaignId: filters?.campaignId,
  });

  return campaigns
    .map((campaign) => {
      const summary = summarizeCampaign(campaign);
      return {
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        photoCount: summary.photoCount,
        shiftsObserved: campaign.driver_shifts?.length ?? 0,
        workedHours: summary.campaignWorkedHours,
      };
    })
    .sort((a, b) => (b.photoCount + b.shiftsObserved) - (a.photoCount + a.shiftsObserved))
    .slice(0, TOP_N);
}

async function fetchRoleCampaignsForFilters(
  range: AnalyticsRange,
  filters: { driverId?: string; clientId?: string },
): Promise<RawRoleFilterCampaignRow[]> {
  const { from, to } = getDateRange(range);
  let query = supabase
    .from('campaigns')
    .select(`
      id,
      title,
      client_id,
      clients ( id, name )
    `)
    .gte('campaign_date', from)
    .lte('campaign_date', to);

  if (filters.driverId) {
    query = query.eq('driver_profile_id', filters.driverId);
  }
  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  const { data, error } = await query.order('campaign_date', { ascending: false });
  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Array<{
    id: string;
    title: string;
    client_id: string | null;
    clients: { id: string; name: string }[] | { id: string; name: string } | null;
  }>;

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    client_id: row.client_id,
    clients: Array.isArray(row.clients) ? (row.clients[0] ?? null) : row.clients,
  }));
}

export async function getDriverAnalyticsFilterOptions(
  driverId: string,
  range: AnalyticsRange,
): Promise<DriverAnalyticsFilterOptions> {
  const rows = await fetchRoleCampaignsForFilters(range, { driverId });
  const clientsMap = new Map<string, { id: string; name: string }>();
  const campaignsMap = new Map<string, { id: string; title: string; clientId: string | null }>();

  for (const row of rows) {
    if (row.clients?.id) {
      clientsMap.set(row.clients.id, { id: row.clients.id, name: row.clients.name });
    }
    campaignsMap.set(row.id, {
      id: row.id,
      title: row.title,
      clientId: row.client_id ?? null,
    });
  }

  return {
    clients: Array.from(clientsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    campaigns: Array.from(campaignsMap.values()).sort((a, b) => a.title.localeCompare(b.title)),
  };
}

export async function getClientAnalyticsFilterOptions(
  clientId: string,
  range: AnalyticsRange,
): Promise<ClientAnalyticsFilterOptions> {
  const rows = await fetchRoleCampaignsForFilters(range, { clientId });
  const campaignsMap = new Map<string, { id: string; title: string }>();

  for (const row of rows) {
    campaignsMap.set(row.id, {
      id: row.id,
      title: row.title,
    });
  }

  return {
    campaigns: Array.from(campaignsMap.values()).sort((a, b) => a.title.localeCompare(b.title)),
  };
}
