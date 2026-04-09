import type {
  AnalyticsFilters,
  AnalyticsRange,
  AnalyticsSummary,
  ClientBreakdownRow,
  DriverBreakdownRow,
} from './types';

import { format, subMonths, subYears } from 'date-fns';

/**
 * Analytics Supabase queries for mobile.
 * Mirrors web analytics query layer — same DB, same calculations.
 */
import { supabase } from '@/lib/supabase';
import { grossProfit, marginPct, num, workedHours } from './calculations';

const DRIVER_WAGE_COST_TYPE = 'Driver Wage';
const TOP_N = 5; // fewer on mobile

type RawCampaignRow = {
  id: string;
  status: string;
  client_billed_amount: number | null;
  client_id: string;
  driver_profile_id: string | null;
  clients: { id: string; name: string } | null;
  driver_profile: { id: string; display_name: string } | null;
  campaign_costs: { amount: number; cost_types: { name: string } | null }[];
  driver_shifts: { started_at: string; ended_at: string | null; shift_status: string }[];
};

function getDateRange(range: AnalyticsRange): { from: string; to: string } {
  const to = new Date();
  const from = range === '1y'
    ? subYears(to, 1)
    : subMonths(to, range === '3m' ? 3 : 6);
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
    status: filters.status ?? null,
  });
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
      id, status, client_billed_amount,
      client_id, driver_profile_id,
      clients ( id, name ),
      driver_profile:profiles!driver_profile_id ( id, display_name ),
      campaign_costs ( amount, cost_types ( name ) ),
      driver_shifts ( started_at, ended_at, shift_status )
    `)
    .gte('campaign_date', from)
    .lte('campaign_date', to);

  if (filters.clientId)
    query = query.eq('client_id', filters.clientId);
  if (filters.driverId)
    query = query.eq('driver_profile_id', filters.driverId);
  if (filters.status)
    query = query.eq('status', filters.status);

  const { data, error } = await query.order('campaign_date', { ascending: false });

  if (error)
    throw error;

  const normalize = (val: unknown) =>
    Array.isArray(val) ? (val[0] ?? null) : (val ?? null);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
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
    driver_shifts: (row.driver_shifts ?? []),
  })) as RawCampaignRow[];
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

    if (row.status === 'active')
      activeCampaigns++;
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
    const driverId = row.driver_profile_id;
    if (!driverId)
      continue;

    const driverName = row.driver_profile?.display_name ?? 'Unknown';

    let acc = map.get(driverId);
    if (!acc) {
      acc = { driverName, hours: 0, payout: 0, campaignCount: 0 };
      map.set(driverId, acc);
    }

    acc.campaignCount++;

    for (const cc of row.campaign_costs ?? []) {
      if (cc.cost_types?.name === DRIVER_WAGE_COST_TYPE) {
        acc.payout += num(cc.amount);
      }
    }

    for (const shift of row.driver_shifts ?? []) {
      if (shift.shift_status === 'completed' && shift.ended_at) {
        acc.hours += workedHours(shift.started_at, shift.ended_at);
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
