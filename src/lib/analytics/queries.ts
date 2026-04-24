import type {
  AnalyticsFilters,
  AnalyticsRange,
  AnalyticsSummary,
  ClientBreakdownRow,
  DriverBreakdownRow,
} from './types';

import { format, subDays, subMonths, subWeeks, subYears } from 'date-fns';

/**
 * Analytics Supabase queries for mobile.
 * Mirrors web analytics query layer — same DB, same calculations.
 */
import { deriveCampaignStatus } from '@/lib/campaign-lifecycle';
import { supabase } from '@/lib/supabase';
import { grossProfit, marginPct, num, workedHours } from './calculations';

const DRIVER_WAGE_COST_TYPE = 'Driver Wage';
const TOP_N = 5; // fewer on mobile

type RawCampaignRow = {
  id: string;
  title: string;
  campaign_date: string;
  status: string;
  client_billed_amount: number | null;
  client_id: string;
  driver_profile_id: string | null;
  clients: { id: string; name: string } | null;
  driver_profile: { id: string; display_name: string } | null;
  campaign_costs: { amount: number; cost_types: { name: string } | null }[];
  driver_shifts: {
    started_at: string;
    ended_at: string | null;
    shift_status: string;
    driver_profile_id: string | null;
    driver_profile: { display_name: string } | null;
  }[];
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

const fetchCache = new Map<string, Promise<RawCampaignRow[]>>();

function filtersKey(filters: AnalyticsFilters): string {
  return JSON.stringify({
    range: filters.range,
    clientId: filters.clientId ?? null,
    driverId: filters.driverId ?? null,
    campaignId: filters.campaignId ?? null,
    status: filters.status ?? null,
  });
}

function campaignMatchesDriver(row: RawCampaignRow, driverId: string): boolean {
  if (row.driver_profile_id === driverId)
    return true;
  return (row.driver_shifts ?? []).some(shift => shift.driver_profile_id === driverId);
}

function getCampaigns(filters: AnalyticsFilters): Promise<RawCampaignRow[]> {
  const key = filtersKey(filters);
  const cached = fetchCache.get(key);
  if (cached)
    return cached;
  const promise = fetchCampaignsRaw(filters).finally(() => fetchCache.delete(key));
  fetchCache.set(key, promise);
  return promise;
}

async function fetchCampaignsRaw(filters: AnalyticsFilters): Promise<RawCampaignRow[]> {
  const { from, to } = getDateRange(filters.range);

  let query = supabase
    .from('campaigns')
    .select(`
      id, title, status, client_billed_amount,
      campaign_date,
      client_id, driver_profile_id,
      clients ( id, name ),
      driver_profile:profiles!driver_profile_id ( id, display_name ),
      campaign_costs ( amount, cost_types ( name ) ),
      driver_shifts (
        started_at, ended_at, shift_status, driver_profile_id,
        driver_profile:profiles!driver_profile_id ( display_name )
      )
    `)
    .gte('campaign_date', from)
    .lte('campaign_date', to);

  if (filters.clientId)
    query = query.eq('client_id', filters.clientId);
  if (filters.campaignId)
    query = query.eq('id', filters.campaignId);
  const { data, error } = await query.order('campaign_date', { ascending: false });

  if (error)
    throw error;

  const normalize = (val: unknown) =>
    Array.isArray(val) ? (val[0] ?? null) : (val ?? null);

  const rows = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    title: row.title,
    campaign_date: row.campaign_date,
    status: row.status,
    client_billed_amount: row.client_billed_amount,
    client_id: row.client_id,
    driver_profile_id: row.driver_profile_id,
    clients: normalize(row.clients),
    driver_profile: normalize(row.driver_profile),
    campaign_costs: ((row.campaign_costs ?? []) as Array<Record<string, unknown>>).map(c => ({
      amount: c.amount,
      cost_types: normalize(c.cost_types),
    })),
    driver_shifts: ((row.driver_shifts ?? []) as Array<Record<string, unknown>>).map(shift => ({
      started_at: shift.started_at as string,
      ended_at: (shift.ended_at as string | null) ?? null,
      shift_status: shift.shift_status as string,
      driver_profile_id: (shift.driver_profile_id as string | null) ?? null,
      driver_profile: normalize(shift.driver_profile) as { display_name: string } | null,
    })),
  })) as RawCampaignRow[];

  const driverFilteredRows = filters.driverId
    ? rows.filter(row => campaignMatchesDriver(row, filters.driverId!))
    : rows;

  if (filters.status) {
    return driverFilteredRows.filter(row =>
      deriveCampaignStatus({
        campaignDate: row.campaign_date,
        rawStatus: row.status,
        shifts: row.driver_shifts,
      }) === filters.status,
    );
  }

  return driverFilteredRows;
}

export async function getSummary(filters: AnalyticsFilters): Promise<AnalyticsSummary> {
  const rows = await getCampaigns(filters);

  let revenue = 0;
  let driverCost = 0;
  let internalCost = 0;
  let billableHours = 0;
  let activeCampaigns = 0;

  for (const row of rows) {
    revenue += num(row.client_billed_amount);

    for (const cc of row.campaign_costs ?? []) {
      if (cc.cost_types?.name === DRIVER_WAGE_COST_TYPE) {
        driverCost += num(cc.amount);
      }
      else {
        internalCost += num(cc.amount);
      }
    }

    for (const shift of row.driver_shifts ?? []) {
      if (shift.shift_status === 'completed' && shift.ended_at) {
        billableHours += workedHours(shift.started_at, shift.ended_at);
      }
    }

    if (deriveCampaignStatus({
      campaignDate: row.campaign_date,
      rawStatus: row.status,
      shifts: row.driver_shifts,
    }) === 'active') {
      activeCampaigns++;
    }
  }

  const profit = grossProfit(revenue, driverCost, internalCost);

  return {
    revenue,
    driverCost,
    internalCost,
    grossProfit: profit,
    marginPct: marginPct(revenue, profit),
    billableHours,
    activeCampaigns,
    totalCampaigns: rows.length,
  };
}

export async function getClientBreakdown(filters: AnalyticsFilters): Promise<ClientBreakdownRow[]> {
  const rows = await getCampaigns(filters);
  const map = new Map<string, { clientName: string; revenue: number; campaignCount: number }>();

  for (const row of rows) {
    const clientId = row.client_id;
    const clientName = row.clients?.name ?? 'Unknown';

    let acc = map.get(clientId);
    if (!acc) {
      acc = { clientName, revenue: 0, campaignCount: 0 };
      map.set(clientId, acc);
    }

    acc.revenue += num(row.client_billed_amount);
    acc.campaignCount++;
  }

  const results: ClientBreakdownRow[] = [];
  for (const [clientId, acc] of map) {
    results.push({ clientId, clientName: acc.clientName, revenue: acc.revenue, campaignCount: acc.campaignCount });
  }

  results.sort((a, b) => b.revenue - a.revenue);
  return results.slice(0, TOP_N);
}

export async function getDriverBreakdown(filters: AnalyticsFilters): Promise<DriverBreakdownRow[]> {
  const rows = await getCampaigns(filters);
  const map = new Map<string, { driverName: string; hours: number; payout: number; campaignCount: number }>();

  for (const row of rows) {
    const participatingDriverIds = new Set<string>();
    for (const shift of row.driver_shifts ?? []) {
      if (shift.driver_profile_id)
        participatingDriverIds.add(shift.driver_profile_id);
    }
    if (participatingDriverIds.size === 0 && row.driver_profile_id) {
      participatingDriverIds.add(row.driver_profile_id);
    }
    if (participatingDriverIds.size === 0)
      continue;
    for (const driverId of participatingDriverIds) {
      let driverName = row.driver_profile_id === driverId
        ? row.driver_profile?.display_name
        : undefined;
      if (!driverName) {
        const shift = row.driver_shifts.find(s => s.driver_profile_id === driverId && s.driver_profile?.display_name);
        driverName = shift?.driver_profile?.display_name;
      }
      let acc = map.get(driverId);
      if (!acc) {
        acc = { driverName: driverName ?? 'Unknown', hours: 0, payout: 0, campaignCount: 0 };
        map.set(driverId, acc);
      }

      acc.campaignCount++;

      // Campaign-level wage costs are attributed to the campaign's assigned driver.
      if (row.driver_profile_id === driverId) {
        for (const cc of row.campaign_costs ?? []) {
          if (cc.cost_types?.name === DRIVER_WAGE_COST_TYPE) {
            acc.payout += num(cc.amount);
          }
        }
      }

      for (const shift of row.driver_shifts ?? []) {
        if (shift.driver_profile_id !== driverId)
          continue;
        if (shift.shift_status === 'completed' && shift.ended_at) {
          acc.hours += workedHours(shift.started_at, shift.ended_at);
        }
      }
    }
  }

  const results: DriverBreakdownRow[] = [];
  for (const [driverId, acc] of map) {
    results.push({
      driverId,
      driverName: acc.driverName,
      workedHours: acc.hours,
      payout: acc.payout,
      campaignCount: acc.campaignCount,
    });
  }

  results.sort((a, b) => b.payout - a.payout);
  return results.slice(0, TOP_N);
}
