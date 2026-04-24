import type { BarDatum } from '@/components/ui/horizontal-bar-chart';
import type { AnalyticsFilters, AnalyticsRange, AnalyticsSummary } from '@/lib/analytics';
import { useQuery } from '@tanstack/react-query';
import LottieView from 'lottie-react-native';
import { MotiView } from 'moti';

import * as React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppLogo } from '@/components/app-logo';
import { EmptyStateWithAnimation } from '@/components/empty-state-with-animation';
import { emptyStatePresets, FilterDrillBurst } from '@/components/motion';
import { lottieAssets } from '@/components/motion/lottie-assets';
import { RevenueCoin, Text, View } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { HorizontalBarChart } from '@/components/ui/horizontal-bar-chart';
import { BarChart, Clock, DollarSign, Truck, Users } from '@/components/ui/icons';
import { LiquidIconBadge } from '@/components/ui/liquid-icon-badge';
import { Modal, useModal } from '@/components/ui/modal';
import { uiPolishClasses, uiPolishSpacing, uiPolishStyles } from '@/components/ui/polish-system';
import { Select } from '@/components/ui/select';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  formatCurrency,
  formatHours,
  formatPercent,
  getClientBreakdown,
  getDriverBreakdown,
  getSummary,
} from '@/lib/analytics';
import { fetchCampaignOptions, fetchClients, fetchDrivers } from '@/lib/api/admin/selectors';

// ─── Range Picker ────────────────────────────────────────────────

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
];

// ─── KPI Card ────────────────────────────────────────────────────

type KpiCardProps = {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  valueColor?: string;
};

function KpiCard({ label, value, icon, valueColor }: KpiCardProps) {
  return (
    <Card className="flex-1 rounded-2xl border border-neutral-200/80 bg-white/95 p-3 dark:border-neutral-700 dark:bg-neutral-800">
      <View className="mb-2 flex-row items-center gap-2">
        <LiquidIconBadge size={28} radius={10}>{icon}</LiquidIconBadge>
        <View className="rounded-md border border-neutral-300/80 bg-neutral-100/85 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-700/65">
          <Text className="text-[11px] font-semibold tracking-wide text-neutral-700 uppercase dark:text-neutral-200">
            {label}
          </Text>
        </View>
      </View>
      <View className="min-h-10 justify-center">
        {typeof value === 'string' ? <Text className={`text-[28px] leading-[32px] font-bold text-neutral-900 dark:text-neutral-100 ${valueColor ?? ''}`}>{value}</Text> : value}
      </View>
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
          value={(
            <RevenueCoin
              formattedValue={formatCurrency(summary.revenue)}
              size={34}
              valueClassName="text-[28px] font-bold leading-[32px] text-neutral-900 dark:text-neutral-100"
            />
          )}
          icon={<DollarSign color="#16a34a" width={14} height={14} />}
        />
        <KpiCard
          label="Profit"
          value={formatCurrency(summary.grossProfit)}
          icon={<DollarSign color="#7c3aed" width={14} height={14} />}
          valueColor="text-violet-700 dark:text-violet-400"
        />
      </View>
      <View className="flex-row gap-2">
        <KpiCard
          label="Margin"
          value={formatPercent(summary.marginPct)}
          icon={<BarChart color="#1d4ed8" width={14} height={14} />}
          valueColor="text-blue-700 dark:text-blue-400"
        />
        <KpiCard
          label="Campaigns"
          value={`${summary.activeCampaigns} / ${summary.totalCampaigns}`}
          icon={<Truck color="#d97706" width={14} height={14} />}
          valueColor="text-amber-700 dark:text-amber-400"
        />
      </View>
      <View className="flex-row gap-2">
        <KpiCard
          label="Driver Cost"
          value={formatCurrency(summary.driverCost)}
          icon={<Users color="#0891b2" width={14} height={14} />}
          valueColor="text-cyan-700 dark:text-cyan-400"
        />
        <KpiCard
          label="Hours"
          value={formatHours(summary.billableHours)}
          icon={<Clock color="#dc2626" width={14} height={14} />}
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
  activeCount: number;
  onOpenFilters: () => void;
};

function FilterHeader(p: FilterHeaderProps) {
  return (
    <View
      className={uiPolishClasses.headerShell}
      style={{ paddingTop: p.paddingTop }}
    >
      <View className="flex-row items-center justify-between px-4 pb-2">
        <AppLogo size="sm" showText />
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open analytics filters"
            className="h-9 items-center justify-center rounded-full bg-neutral-100 px-3 dark:bg-neutral-700"
            onPress={p.onOpenFilters}
          >
            <FilterMotionIcon activeCount={p.activeCount} />
          </Pressable>
          <ThemeToggle />
        </View>
      </View>
      <View className="px-4 pb-3">
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          {p.activeCount > 0 ? `${p.activeCount} filters active` : 'No filters applied'}
        </Text>
      </View>
    </View>
  );
}

function FilterMotionIcon({ activeCount }: { activeCount: number }) {
  return (
    <View className="flex-row items-center gap-1">
      <MotiView
        from={{ scale: 0.92, opacity: 0.6 }}
        animate={{ scale: 1.06, opacity: 1 }}
        transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: true }}
        className="size-3 rounded-full bg-primary"
      />
      <View className="gap-[2px]">
        <View className="h-[2px] w-4 rounded-sm bg-neutral-700 dark:bg-neutral-200" />
        <View className="h-[2px] w-3 rounded-sm bg-neutral-700 dark:bg-neutral-200" />
        <View className="h-[2px] w-2 rounded-sm bg-neutral-700 dark:bg-neutral-200" />
      </View>
      {activeCount > 0 && (
        <View className="min-w-4 rounded-full bg-primary px-1 py-px">
          <Text className="text-center text-[10px] font-semibold text-white">
            {activeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

type DraftFilters = {
  range: AnalyticsRange;
  clientId: string | undefined;
  driverId: string | undefined;
  campaignId: string | undefined;
};

// ─── Data Content ────────────────────────────────────────────────

type DataContentProps = {
  paddingBottom: number;
  showInitialLoading: boolean;
  isError: boolean;
  summary: AnalyticsSummary | undefined;
  clientBars: BarDatum[];
  driverBars: BarDatum[];
};

function DataContent({ paddingBottom, showInitialLoading, isError, summary, clientBars, driverBars }: DataContentProps) {
  if (showInitialLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <LottieView
          source={lottieAssets.assistantBot}
          autoPlay
          loop
          style={{ width: 160, height: 160, alignSelf: 'center' }}
        />
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
    <ScrollView contentContainerStyle={{ padding: uiPolishSpacing.screenPadding, paddingBottom }} showsVerticalScrollIndicator={false}>
      <LottieView
        source={lottieAssets.analyticsCharacter}
        autoPlay
        loop
        style={{ width: '100%', height: 196, alignSelf: 'center' }}
      />
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

// eslint-disable-next-line max-lines-per-function
export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const filterModal = useModal();
  const [range, setRange] = React.useState<AnalyticsRange>('1m');
  const [clientId, setClientId] = React.useState<string | undefined>();
  const [driverId, setDriverId] = React.useState<string | undefined>();
  const [campaignId, setCampaignId] = React.useState<string | undefined>();
  const [draft, setDraft] = React.useState<DraftFilters>({
    range: '1m',
    clientId: undefined,
    driverId: undefined,
    campaignId: undefined,
  });
  const [filterBurstTrigger, setFilterBurstTrigger] = React.useState<string | null>(null);
  const [filterBurstKind, setFilterBurstKind] = React.useState<'range' | 'client' | 'driver' | 'campaign'>('range');

  const filters: AnalyticsFilters = React.useMemo(
    () => ({ range, clientId, driverId, campaignId }),
    [range, clientId, driverId, campaignId],
  );
  const filterKey = React.useMemo(() => JSON.stringify(filters), [filters]);

  const summaryQ = useQuery({
    queryKey: ['analytics-summary', filterKey],
    queryFn: () => getSummary(filters),
    placeholderData: previous => previous,
  });
  const clientsQ = useQuery({
    queryKey: ['analytics-clients', filterKey],
    queryFn: () => getClientBreakdown(filters),
    placeholderData: previous => previous,
  });
  const driversQ = useQuery({
    queryKey: ['analytics-drivers', filterKey],
    queryFn: () => getDriverBreakdown(filters),
    placeholderData: previous => previous,
  });

  const { data: clientOptions = [] } = useQuery({ queryKey: ['selector-clients'], queryFn: fetchClients, staleTime: 5 * 60 * 1000 });
  const { data: driverOptions = [] } = useQuery({ queryKey: ['selector-drivers'], queryFn: fetchDrivers, staleTime: 5 * 60 * 1000 });
  const { data: campaignOptions = [] } = useQuery({ queryKey: ['selector-campaigns'], queryFn: fetchCampaignOptions, staleTime: 5 * 60 * 1000 });

  const clientChipOptions = React.useMemo(() => clientOptions.map(c => ({ label: c.name, value: c.id })), [clientOptions]);
  const driverChipOptions = React.useMemo(() => driverOptions.map(d => ({ label: d.display_name, value: d.id })), [driverOptions]);

  const campaignById = React.useMemo(
    () => new Map(campaignOptions.map(option => [option.id, option])),
    [campaignOptions],
  );
  const filteredCampaignOptions = React.useMemo(
    () =>
      campaignOptions.filter((option) => {
        if (draft.clientId && option.client_id !== draft.clientId)
          return false;
        if (!draft.driverId)
          return true;
        if (option.driver_profile_id === draft.driverId)
          return true;
        return (option.driver_shifts ?? []).some(shift => shift.driver_profile_id === draft.driverId);
      }),
    [campaignOptions, draft.clientId, draft.driverId],
  );
  const rangeSelectOptions = React.useMemo(
    () => RANGES.map(rangeOption => ({ label: rangeOption.label, value: rangeOption.value })),
    [],
  );
  const clientSelectOptions = React.useMemo(
    () => [{ label: 'All clients', value: '' }, ...clientChipOptions],
    [clientChipOptions],
  );
  const driverSelectOptions = React.useMemo(
    () => [{ label: 'All drivers', value: '' }, ...driverChipOptions],
    [driverChipOptions],
  );
  const campaignSelectOptions = React.useMemo(
    () => [
      { label: 'All campaigns', value: '' },
      ...filteredCampaignOptions.map(option => ({ label: option.title, value: option.id })),
    ],
    [filteredCampaignOptions],
  );

  const clientBars: BarDatum[] = (clientsQ.data ?? []).map(c => ({ label: c.clientName, value: c.revenue, formattedValue: formatCurrency(c.revenue) }));
  const driverBars: BarDatum[] = (driversQ.data ?? []).map(d => ({ label: d.driverName, value: d.payout, formattedValue: formatCurrency(d.payout) }));
  const isLoading = summaryQ.isLoading || clientsQ.isLoading || driversQ.isLoading;
  const showInitialLoading = isLoading && !summaryQ.data && !clientsQ.data && !driversQ.data;
  const activeFilterCount = [clientId, driverId, campaignId, range !== '1m' ? 'range' : undefined].filter(Boolean).length;

  function openFilters() {
    setDraft({ range, clientId, driverId, campaignId });
    filterModal.present();
  }

  function applyDraftFilters() {
    let nextCampaignId = draft.campaignId;
    let nextClientId = draft.clientId;
    let nextDriverId = draft.driverId;

    const selectedCampaign = nextCampaignId ? campaignById.get(nextCampaignId) : undefined;
    if (!selectedCampaign) {
      nextCampaignId = undefined;
    }
    if (selectedCampaign) {
      nextClientId = selectedCampaign.client_id;
      if (nextDriverId) {
        const driverMatches = selectedCampaign.driver_profile_id === nextDriverId
          || (selectedCampaign.driver_shifts ?? []).some(shift => shift.driver_profile_id === nextDriverId);
        if (!driverMatches) {
          nextDriverId = undefined;
        }
      }
    }

    setRange(draft.range);
    setCampaignId(nextCampaignId);
    setClientId(nextClientId);
    setDriverId(nextDriverId);
    if (nextCampaignId !== campaignId) {
      setFilterBurstKind('campaign');
    }
    else if (nextDriverId !== driverId) {
      setFilterBurstKind('driver');
    }
    else if (nextClientId !== clientId) {
      setFilterBurstKind('client');
    }
    else if (draft.range !== range) {
      setFilterBurstKind('range');
    }
    setFilterBurstTrigger(`apply:${Date.now()}`);
    filterModal.dismiss();
  }

  function clearDraftFilters() {
    setDraft({
      range: '1m',
      clientId: undefined,
      driverId: undefined,
      campaignId: undefined,
    });
  }

  return (
    <View testID="analytics-screen" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <FilterHeader
        paddingTop={insets.top + 8}
        activeCount={activeFilterCount}
        onOpenFilters={openFilters}
      />
      <DataContent
        paddingBottom={insets.bottom + 16}
        showInitialLoading={showInitialLoading}
        isError={summaryQ.isError || clientsQ.isError || driversQ.isError}
        summary={summaryQ.data}
        clientBars={clientBars}
        driverBars={driverBars}
      />
      <FilterDrillBurst
        trigger={filterBurstTrigger}
        accessibilityLabel="Filter applied"
        // Mapping contract: range->advanced, client->dataAnalytics, driver->dashboard, campaign->dataExtraction.
        source={filterBurstKind === 'range'
          ? lottieAssets.advancedAnalytics
          : filterBurstKind === 'client'
            ? lottieAssets.dataAnalyticsAndResearch
            : filterBurstKind === 'driver'
              ? lottieAssets.dashboardBi
              : lottieAssets.dataExtraction}
      />
      <Modal ref={filterModal.ref} title="Analytics Filters" snapPoints={['72%']}>
        <ScrollView contentContainerStyle={uiPolishStyles.modalListContent}>
          <View className="gap-3">
            <Text className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Range</Text>
            <Select
              testID="admin-analytics-range-select"
              value={draft.range}
              options={rangeSelectOptions}
              onSelect={value => setDraft(prev => ({ ...prev, range: value as AnalyticsRange }))}
            />
          </View>
          <View className="gap-3">
            <Text className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Client</Text>
            <Select
              testID="admin-analytics-client-select"
              value={draft.clientId ?? ''}
              options={clientSelectOptions}
              onSelect={(value) => {
                const nextClientId = value ? String(value) : undefined;
                setDraft(prev => ({ ...prev, clientId: nextClientId }));
              }}
            />
          </View>
          <View className="gap-3">
            <Text className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Driver</Text>
            <Select
              testID="admin-analytics-driver-select"
              value={draft.driverId ?? ''}
              options={driverSelectOptions}
              onSelect={(value) => {
                const nextDriverId = value ? String(value) : undefined;
                setDraft(prev => ({ ...prev, driverId: nextDriverId }));
              }}
            />
          </View>
          <View className="gap-3">
            <Text className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Campaign</Text>
            <Select
              testID="admin-analytics-campaign-select"
              value={draft.campaignId ?? ''}
              options={campaignSelectOptions}
              onSelect={(value) => {
                const nextCampaignId = value ? String(value) : undefined;
                setDraft(prev => ({ ...prev, campaignId: nextCampaignId }));
              }}
            />
          </View>
          <View className="mt-2 flex-row gap-2">
            <Pressable
              onPress={clearDraftFilters}
              className="flex-1 items-center rounded-lg bg-neutral-200 p-3 dark:bg-neutral-700"
            >
              <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Clear All</Text>
            </Pressable>
            <Pressable
              onPress={applyDraftFilters}
              className="flex-1 items-center rounded-lg bg-primary p-3"
            >
              <Text className="text-sm font-semibold text-white">Apply Filters</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}
