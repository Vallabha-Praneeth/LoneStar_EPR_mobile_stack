import type {
  AnalyticsRange,
  AnalyticsSummary,
  ClientBreakdownRow,
  DriverBreakdownRow,
} from './types';

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
  const from = new Date();
  const months = range === '3m' ? 3 : range === '6m' ? 6 : 12;
  from.setMonth(from.getMonth() - months);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

async function fetchCampaigns(range: AnalyticsRange): Promise<RawCampaignRow[]> {
  const { from, to } = getDateRange(range);

  const { data, error } = await supabase
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
    .lte('campaign_date', to)
    .order('campaign_date', { ascending: false });

  if (error)
    throw error;
  return (data ?? []) as unknown as RawCampaignRow[];
}

export async function getSummary(range: AnalyticsRange): Promise<AnalyticsSummary> {
  const rows = await fetchCampaigns(range);

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

export async function getClientBreakdown(range: AnalyticsRange): Promise<ClientBreakdownRow[]> {
  const rows = await fetchCampaigns(range);
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

export async function getDriverBreakdown(range: AnalyticsRange): Promise<DriverBreakdownRow[]> {
  const rows = await fetchCampaigns(range);
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
