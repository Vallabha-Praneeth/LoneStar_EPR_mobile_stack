import type { BarDatum } from '@/components/ui/horizontal-bar-chart';
import type { AnalyticsFilters, AnalyticsRange, AnalyticsSummary, CampaignStatus } from '@/lib/analytics';
import { useQuery } from '@tanstack/react-query';

import * as React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppLogo } from '@/components/app-logo';
import { EmptyStateWithAnimation } from '@/components/empty-state-with-animation';
import { DashboardHeroAnimation, emptyStatePresets, ListPaginationAnimation, lottieAssets } from '@/components/motion';
import { Text, View } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { HorizontalBarChart } from '@/components/ui/horizontal-bar-chart';
import { BarChart, Clock, DollarSign, Truck, Users } from '@/components/ui/icons';
import { useModal } from '@/components/ui/modal';
import { Options } from '@/components/ui/select';
import {
  formatCurrency,
  formatHours,
  formatPercent,
  getClientBreakdown,
  getDriverBreakdown,
  getSummary,
} from '@/lib/analytics';
import { fetchClients, fetchDrivers } from '@/lib/api/admin/selectors';

// ─── Range Picker ────────────────────────────────────────────────

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
];

const STATUSES: { value: CampaignStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'draft', label: 'Draft' },
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

// ─── Filter Chip ─────────────────────────────────────────────────

type FilterChipProps = {
  placeholder: string;
  selectedLabel?: string;
  active: boolean;
  options: { label: string; value: string }[];
  currentValue: string | undefined;
  onSelect: (value: string | undefined) => void;
};

function FilterChip({
  placeholder,
  selectedLabel,
  active,
  options,
  currentValue,
  onSelect,
}: FilterChipProps) {
  const modal = useModal();

  const allOptions = React.useMemo(
    () => [{ label: `All ${placeholder}s`, value: '' }, ...options],
    [placeholder, options],
  );

  return (
    <>
      <Pressable
        onPress={modal.present}
        className={`flex-row items-center gap-1 rounded-lg px-3 py-1.5 ${
          active ? 'bg-primary' : 'bg-neutral-100 dark:bg-neutral-700'
        }`}
      >
        <Text
          className={`text-xs font-semibold ${
            active ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
          }`}
          numberOfLines={1}
        >
          {selectedLabel ?? placeholder}
        </Text>
      </Pressable>
      <Options
        ref={modal.ref}
        options={allOptions}
        value={currentValue ?? ''}
        onSelect={(opt) => {
          onSelect(opt.value === '' ? undefined : String(opt.value));
          modal.dismiss();
        }}
      />
    </>
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

// ─── Filter Header ───────────────────────────────────────────────

type FilterHeaderProps = {
  paddingTop: number;
  range: AnalyticsRange;
  clientId: string | undefined;
  driverId: string | undefined;
  status: CampaignStatus | undefined;
  clientChipOptions: { label: string; value: string }[];
  driverChipOptions: { label: string; value: string }[];
  selectedClientLabel: string | undefined;
  selectedDriverLabel: string | undefined;
  selectedStatusLabel: string | undefined;
  onRangeChange: (r: AnalyticsRange) => void;
  onClientChange: (v: string | undefined) => void;
  onDriverChange: (v: string | undefined) => void;
  onStatusChange: (v: CampaignStatus | undefined) => void;
  onClear: () => void;
};

function FilterHeader(p: FilterHeaderProps) {
  return (
    <View
      className="border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
      style={{ paddingTop: p.paddingTop }}
    >
      <View className="flex-row items-center justify-between px-4 pb-2">
        <AppLogo size="sm" showText />
        <RangePicker value={p.range} onChange={p.onRangeChange} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8, flexDirection: 'row' }}
      >
        <FilterChip placeholder="Client" selectedLabel={p.selectedClientLabel} active={!!p.clientId} options={p.clientChipOptions} currentValue={p.clientId} onSelect={p.onClientChange} />
        <FilterChip placeholder="Driver" selectedLabel={p.selectedDriverLabel} active={!!p.driverId} options={p.driverChipOptions} currentValue={p.driverId} onSelect={p.onDriverChange} />
        <FilterChip placeholder="Status" selectedLabel={p.selectedStatusLabel} active={!!p.status} options={STATUSES.map(s => ({ label: s.label, value: s.value }))} currentValue={p.status} onSelect={v => p.onStatusChange(v as CampaignStatus | undefined)} />
        {(p.clientId || p.driverId || p.status) && (
          <Pressable onPress={p.onClear} className="rounded-lg bg-neutral-200 px-3 py-1.5 dark:bg-neutral-600">
            <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Clear</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Data Content ────────────────────────────────────────────────

type DataContentProps = {
  paddingBottom: number;
  isLoading: boolean;
  isError: boolean;
  summary: AnalyticsSummary | undefined;
  clientBars: BarDatum[];
  driverBars: BarDatum[];
};

function DataContent({ paddingBottom, isLoading, isError, summary, clientBars, driverBars }: DataContentProps) {
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ListPaginationAnimation size={100} />
      </View>
    );
  }
  if (isError) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          Couldn't load analytics right now. Please try again.
        </Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom }} showsVerticalScrollIndicator={false}>
      <View className="mb-4 items-center">
        <DashboardHeroAnimation width={280} height={130} />
      </View>
      {summary && <KpiGrid summary={summary} />}
      {clientBars.length > 0 && (
        <SectionCard title="Top Clients by Revenue">
          <HorizontalBarChart data={clientBars} barColor="#22c55e" />
        </SectionCard>
      )}
      {driverBars.length > 0 && (
        <SectionCard title="Top Drivers by Payout">
          <HorizontalBarChart data={driverBars} barColor="#3b82f6" />
        </SectionCard>
      )}
      {summary && summary.totalCampaigns === 0 && (
        <EmptyStateWithAnimation source={lottieAssets.adminEmptySearch} message="No campaign data for this period" testID="admin-analytics-empty-animation" {...emptyStatePresets.adminAnalytics} />
      )}
    </ScrollView>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────

export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [range, setRange] = React.useState<AnalyticsRange>('1m');
  const [clientId, setClientId] = React.useState<string | undefined>();
  const [driverId, setDriverId] = React.useState<string | undefined>();
  const [status, setStatus] = React.useState<CampaignStatus | undefined>();

  const filters: AnalyticsFilters = React.useMemo(
    () => ({ range, clientId, driverId, status }),
    [range, clientId, driverId, status],
  );
  const filterKey = React.useMemo(() => JSON.stringify(filters), [filters]);

  const summaryQ = useQuery({ queryKey: ['analytics-summary', filterKey], queryFn: () => getSummary(filters) });
  const clientsQ = useQuery({ queryKey: ['analytics-clients', filterKey], queryFn: () => getClientBreakdown(filters) });
  const driversQ = useQuery({ queryKey: ['analytics-drivers', filterKey], queryFn: () => getDriverBreakdown(filters) });

  const { data: clientOptions = [] } = useQuery({ queryKey: ['selector-clients'], queryFn: fetchClients, staleTime: 5 * 60 * 1000 });
  const { data: driverOptions = [] } = useQuery({ queryKey: ['selector-drivers'], queryFn: fetchDrivers, staleTime: 5 * 60 * 1000 });

  const clientChipOptions = React.useMemo(() => clientOptions.map(c => ({ label: c.name, value: c.id })), [clientOptions]);
  const driverChipOptions = React.useMemo(() => driverOptions.map(d => ({ label: d.display_name, value: d.id })), [driverOptions]);

  const selectedClientLabel = clientId ? clientOptions.find(c => c.id === clientId)?.name : undefined;
  const selectedDriverLabel = driverId ? driverOptions.find(d => d.id === driverId)?.display_name : undefined;
  const selectedStatusLabel = status ? STATUSES.find(s => s.value === status)?.label : undefined;

  const clientBars: BarDatum[] = (clientsQ.data ?? []).map(c => ({ label: c.clientName, value: c.revenue, formattedValue: formatCurrency(c.revenue) }));
  const driverBars: BarDatum[] = (driversQ.data ?? []).map(d => ({ label: d.driverName, value: d.payout, formattedValue: formatCurrency(d.payout) }));

  return (
    <View testID="analytics-screen" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <FilterHeader
        paddingTop={insets.top + 8}
        range={range}
        clientId={clientId}
        driverId={driverId}
        status={status}
        clientChipOptions={clientChipOptions}
        driverChipOptions={driverChipOptions}
        selectedClientLabel={selectedClientLabel}
        selectedDriverLabel={selectedDriverLabel}
        selectedStatusLabel={selectedStatusLabel}
        onRangeChange={setRange}
        onClientChange={setClientId}
        onDriverChange={setDriverId}
        onStatusChange={setStatus}
        onClear={() => {
          setClientId(undefined);
          setDriverId(undefined);
          setStatus(undefined);
        }}
      />
      <DataContent
        paddingBottom={insets.bottom + 16}
        isLoading={summaryQ.isLoading || clientsQ.isLoading || driversQ.isLoading}
        isError={summaryQ.isError || clientsQ.isError || driversQ.isError}
        summary={summaryQ.data}
        clientBars={clientBars}
        driverBars={driverBars}
      />
    </View>
  );
}
