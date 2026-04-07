/** Analytics domain types — mirrors web analytics contracts. */

export type AnalyticsRange = '3m' | '6m' | '1y';

export type AnalyticsSummary = {
  revenue: number;
  driverCost: number;
  internalCost: number;
  grossProfit: number;
  marginPct: number;
  billableHours: number;
  activeCampaigns: number;
  totalCampaigns: number;
};

export type ClientBreakdownRow = {
  clientId: string;
  clientName: string;
  revenue: number;
  campaignCount: number;
};

export type DriverBreakdownRow = {
  driverId: string;
  driverName: string;
  workedHours: number;
  payout: number;
  campaignCount: number;
};
