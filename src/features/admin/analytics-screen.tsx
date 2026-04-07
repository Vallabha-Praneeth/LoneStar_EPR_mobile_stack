import type { BarDatum } from '@/components/ui/horizontal-bar-chart';
import type { AnalyticsRange, AnalyticsSummary } from '@/lib/analytics';
import { useQuery } from '@tanstack/react-query';

import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppLogo } from '@/components/app-logo';
import { EmptyStateWithAnimation } from '@/components/empty-state-with-animation';
import { emptyStatePresets, lottieAssets } from '@/components/motion';
import { Text, View } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { HorizontalBarChart } from '@/components/ui/horizontal-bar-chart';
import { BarChart, Clock, DollarSign, Truck, Users } from '@/components/ui/icons';
import {

  formatCurrency,
  formatHours,
  formatPercent,
  getClientBreakdown,
  getDriverBreakdown,
  getSummary,
} from '@/lib/analytics';

// ─── Range Picker ────────────────────────────────────────────────

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
];

function RangePicker({
  value,
  onChange,
}: {
  value: AnalyticsRange;
  onChange: (r: AnalyticsRange) => void;
}) {
  return (
    <View className="flex-row gap-1.5">
      {RANGES.map(r => (
        <Pressable
          key={r.value}
          accessibilityRole="button"
          accessibilityState={{ selected: r.value === value }}
          className={`rounded-lg px-3 py-1.5 ${
            r.value === value
              ? 'bg-primary'
              : 'bg-neutral-100 dark:bg-neutral-700'
          }`}
          onPress={() => onChange(r.value)}
        >
          <Text
            className={`text-xs font-semibold ${
              r.value === value
                ? 'text-white'
                : 'text-neutral-600 dark:text-neutral-300'
            }`}
          >
            {r.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────

type KpiCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
};

function KpiCard({ label, value, icon, iconBg, valueColor }: KpiCardProps) {
  return (
    <Card className="flex-1 p-3">
      <View className={`mb-2 size-7 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </View>
      <Text className={`text-lg font-bold ${valueColor ?? ''}`}>{value}</Text>
      <Text className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">
        {label}
      </Text>
    </Card>
  );
}

// ─── KPI Grid ────────────────────────────────────────────────────

function KpiGrid({ summary }: { summary: AnalyticsSummary }) {
  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        <KpiCard
          label="Revenue"
          value={formatCurrency(summary.revenue)}
          icon={<DollarSign color="#16a34a" width={14} height={14} />}
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          valueColor="text-emerald-700 dark:text-emerald-400"
        />
        <KpiCard
          label="Profit"
          value={formatCurrency(summary.grossProfit)}
          icon={<DollarSign color="#7c3aed" width={14} height={14} />}
          iconBg="bg-violet-50 dark:bg-violet-950/40"
          valueColor="text-violet-700 dark:text-violet-400"
        />
      </View>
      <View className="flex-row gap-2">
        <KpiCard
          label="Margin"
          value={formatPercent(summary.marginPct)}
          icon={<BarChart color="#1d4ed8" width={14} height={14} />}
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          valueColor="text-blue-700 dark:text-blue-400"
        />
        <KpiCard
          label="Campaigns"
          value={`${summary.activeCampaigns} / ${summary.totalCampaigns}`}
          icon={<Truck color="#d97706" width={14} height={14} />}
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          valueColor="text-amber-700 dark:text-amber-400"
        />
      </View>
      <View className="flex-row gap-2">
        <KpiCard
          label="Driver Cost"
          value={formatCurrency(summary.driverCost)}
          icon={<Users color="#0891b2" width={14} height={14} />}
          iconBg="bg-cyan-50 dark:bg-cyan-950/40"
          valueColor="text-cyan-700 dark:text-cyan-400"
        />
        <KpiCard
          label="Hours"
          value={formatHours(summary.billableHours)}
          icon={<Clock color="#dc2626" width={14} height={14} />}
          iconBg="bg-red-50 dark:bg-red-950/40"
          valueColor="text-red-700 dark:text-red-400"
        />
      </View>
    </View>
  );
}

// ─── Section Card ────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mt-3 p-4">
      <Text className="mb-3 text-sm font-semibold">{title}</Text>
      {children}
    </Card>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────

export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [range, setRange] = React.useState<AnalyticsRange>('3m');

  const summaryQuery = useQuery({
    queryKey: ['analytics-summary', range],
    queryFn: () => getSummary(range),
  });

  const clientsQuery = useQuery({
    queryKey: ['analytics-clients', range],
    queryFn: () => getClientBreakdown(range),
  });

  const driversQuery = useQuery({
    queryKey: ['analytics-drivers', range],
    queryFn: () => getDriverBreakdown(range),
  });

  const isLoading = summaryQuery.isLoading || clientsQuery.isLoading || driversQuery.isLoading;
  const isError = summaryQuery.isError || clientsQuery.isError || driversQuery.isError;

  const clientBars: BarDatum[] = (clientsQuery.data ?? []).map(c => ({
    label: c.clientName,
    value: c.revenue,
    formattedValue: formatCurrency(c.revenue),
  }));

  const driverBars: BarDatum[] = (driversQuery.data ?? []).map(d => ({
    label: d.driverName,
    value: d.payout,
    formattedValue: formatCurrency(d.payout),
  }));

  return (
    <View testID="analytics-screen" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <View
        className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pb-3 dark:border-neutral-700 dark:bg-neutral-800"
        style={{ paddingTop: insets.top + 8 }}
      >
        <AppLogo size="sm" showText />
        <RangePicker value={range} onChange={setRange} />
      </View>

      {isLoading
        ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" />
            </View>
          )
        : isError
          ? (
              <View className="flex-1 items-center justify-center px-6">
                <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                  Couldn't load analytics right now. Please try again.
                </Text>
              </View>
            )
          : (
              <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
                showsVerticalScrollIndicator={false}
              >
                {/* KPI Cards */}
                {summaryQuery.data && <KpiGrid summary={summaryQuery.data} />}

                {/* Top Clients */}
                {clientBars.length > 0 && (
                  <SectionCard title="Top Clients by Revenue">
                    <HorizontalBarChart data={clientBars} barColor="#22c55e" />
                  </SectionCard>
                )}

                {/* Top Drivers */}
                {driverBars.length > 0 && (
                  <SectionCard title="Top Drivers by Payout">
                    <HorizontalBarChart data={driverBars} barColor="#3b82f6" />
                  </SectionCard>
                )}

                {/* Empty state */}
                {summaryQuery.data && summaryQuery.data.totalCampaigns === 0 && (
                  <EmptyStateWithAnimation
                    source={lottieAssets.adminEmptySearch}
                    message="No campaign data for this period"
                    testID="admin-analytics-empty-animation"
                    {...emptyStatePresets.adminAnalytics}
                  />
                )}
              </ScrollView>
            )}
    </View>
  );
}
