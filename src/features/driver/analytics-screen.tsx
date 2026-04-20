import type { BarDatum } from '@/components/ui/horizontal-bar-chart';
import type { AnalyticsRange } from '@/lib/analytics';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import * as React from 'react';
import { View } from 'react-native';
import { FilterDrillBurst } from '@/components/motion';
import { lottieAssets } from '@/components/motion/lottie-assets';
import { Camera, CheckCircle, Clock, Truck, Users } from '@/components/ui/icons';
import { RoleAnalyticsScreen } from '@/features/analytics/role-analytics-screen';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { formatHours, formatNumber } from '@/lib/analytics';
import {
  getDriverAnalyticsFilterOptions,
  getDriverAnalyticsSummary,
  getDriverCampaignBreakdown,
} from '@/lib/analytics/role-queries';
import { useFilterTransition } from '@/lib/hooks/use-filter-transition';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

// eslint-disable-next-line max-lines-per-function
export function DriverAnalyticsScreen() {
  const router = useRouter();
  const profile = useAuthStore.use.profile();
  const reducedMotion = useReducedMotion();
  const [range, setRange] = React.useState<AnalyticsRange>('1w');
  const [selectedClientId, setSelectedClientId] = React.useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>('');
  const [clientBurstTrigger, setClientBurstTrigger] = React.useState<string | null>(null);
  const [campaignBurstTrigger, setCampaignBurstTrigger] = React.useState<string | null>(null);
  const [rangeBurstTrigger, setRangeBurstTrigger] = React.useState<string | null>(null);
  const hasHandledInitialRangeRef = React.useRef(false);
  const { isTransitioning: isFilterTransitioning, startTransition: startFilterTransition } = useFilterTransition({ durationMs: 700 });

  React.useEffect(() => {
    if (!hasHandledInitialRangeRef.current) {
      hasHandledInitialRangeRef.current = true;
      return;
    }
    setRangeBurstTrigger(`range:${range}`);
    startFilterTransition();
  }, [range, startFilterTransition]);

  const summaryQ = useQuery({
    queryKey: ['driver-analytics-summary', profile?.id, range, selectedClientId, selectedCampaignId],
    queryFn: () =>
      getDriverAnalyticsSummary(profile!.id, range, {
        clientId: selectedClientId || undefined,
        campaignId: selectedCampaignId || undefined,
      }),
    enabled: !!profile?.id,
  });
  const campaignsQ = useQuery({
    queryKey: ['driver-analytics-campaigns', profile?.id, range, selectedClientId, selectedCampaignId],
    queryFn: () =>
      getDriverCampaignBreakdown(profile!.id, range, {
        clientId: selectedClientId || undefined,
        campaignId: selectedCampaignId || undefined,
      }),
    enabled: !!profile?.id,
  });
  const filterOptionsQ = useQuery({
    queryKey: ['driver-analytics-filter-options', profile?.id, range],
    queryFn: () => getDriverAnalyticsFilterOptions(profile!.id, range),
    enabled: !!profile?.id,
  });

  const clientFilterOptions = React.useMemo(
    () => [
      { label: 'All clients', value: '' },
      ...(filterOptionsQ.data?.clients ?? []).map(client => ({
        label: client.name,
        value: client.id,
      })),
    ],
    [filterOptionsQ.data?.clients],
  );
  const campaignFilterOptions = React.useMemo(
    () => [
      { label: 'All campaigns', value: '' },
      ...(filterOptionsQ.data?.campaigns ?? [])
        .filter(campaign => !selectedClientId || campaign.clientId === selectedClientId)
        .map(campaign => ({
          label: campaign.title,
          value: campaign.id,
        })),
    ],
    [filterOptionsQ.data?.campaigns, selectedClientId],
  );

  React.useEffect(() => {
    if (!selectedCampaignId) {
      return;
    }
    const exists = campaignFilterOptions.some(option => option.value === selectedCampaignId);
    if (!exists) {
      setSelectedCampaignId('');
    }
  }, [campaignFilterOptions, selectedCampaignId]);

  const summary = summaryQ.data;
  const hasData = (summary?.totalCampaigns ?? 0) > 0;
  const avgStopsPerCampaign = summary && summary.totalCampaigns > 0
    ? (summary.completedStops / summary.totalCampaigns).toFixed(1)
    : '0.0';

  const photoBars: BarDatum[] = (campaignsQ.data ?? []).map(campaign => ({
    label: campaign.campaignTitle,
    value: campaign.photoCount,
    formattedValue: formatNumber(campaign.photoCount),
  }));
  const stopBars: BarDatum[] = (campaignsQ.data ?? []).map(campaign => ({
    label: campaign.campaignTitle,
    value: campaign.completedStops,
    formattedValue: formatNumber(campaign.completedStops),
  }));

  const cards = summary
    ? [
        {
          label: 'Campaigns',
          value: `${summary.activeCampaigns} / ${summary.totalCampaigns}`,
          icon: <Truck color="#d97706" width={14} height={14} />,
          iconBg: 'bg-amber-50 dark:bg-amber-950/40',
          valueColor: 'text-amber-700 dark:text-amber-400',
        },
        {
          label: 'Photos',
          value: formatNumber(summary.totalPhotos),
          icon: <Camera color="#1d4ed8" width={14} height={14} />,
          iconBg: 'bg-blue-50 dark:bg-blue-950/40',
          valueColor: 'text-blue-700 dark:text-blue-400',
        },
        {
          label: 'Stops',
          value: formatNumber(summary.completedStops),
          icon: <CheckCircle color="#16a34a" width={14} height={14} />,
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
          valueColor: 'text-emerald-700 dark:text-emerald-400',
        },
        {
          label: 'Hours',
          value: formatHours(summary.workedHours),
          icon: <Clock color="#dc2626" width={14} height={14} />,
          iconBg: 'bg-red-50 dark:bg-red-950/40',
          valueColor: 'text-red-700 dark:text-red-400',
        },
        {
          label: 'Shifts',
          value: formatNumber(summary.shiftsWorked),
          icon: <Users color="#0891b2" width={14} height={14} />,
          iconBg: 'bg-cyan-50 dark:bg-cyan-950/40',
          valueColor: 'text-cyan-700 dark:text-cyan-400',
        },
        {
          label: 'Avg Stops',
          value: avgStopsPerCampaign,
          icon: <Users color="#7c3aed" width={14} height={14} />,
          iconBg: 'bg-violet-50 dark:bg-violet-950/40',
          valueColor: 'text-violet-700 dark:text-violet-400',
        },
      ]
    : [];

  return (
    <>
      {!reducedMotion
        ? (
            <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 }}>
              <View
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: '#e5e5e5',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden',
                }}
              >
                <LottieView
                  source={lottieAssets.driverAnalyticsHero}
                  autoPlay
                  loop
                  style={{ width: '100%', height: 208, alignSelf: 'center' }}
                />
              </View>
            </View>
          )
        : null}
      <RoleAnalyticsScreen
        testID="driver-analytics-screen"
        title="Driver analytics"
        range={range}
        onRangeChange={setRange}
        onBack={() => router.back()}
        cards={cards}
        primarySection={{
          title: 'Top Campaigns by Photos',
          data: photoBars,
          barColor: '#3b82f6',
        }}
        secondarySection={{
          title: 'Top Campaigns by Completed Stops',
          data: stopBars,
          barColor: '#22c55e',
        }}
        isLoading={summaryQ.isLoading || campaignsQ.isLoading}
        isError={summaryQ.isError || campaignsQ.isError}
        hasData={hasData}
        emptyMessage="No driver activity for this period"
        suppressContent={isFilterTransitioning}
        extraFilters={[
          {
            id: 'driver-client-filter',
            label: 'Client',
            value: selectedClientId,
            options: clientFilterOptions,
            onChange: (next) => {
              setSelectedClientId(next);
              setSelectedCampaignId('');
              setClientBurstTrigger(`client:${next || 'all'}:${Date.now()}`);
              startFilterTransition();
            },
          },
          {
            id: 'driver-campaign-filter',
            label: 'Campaign',
            value: selectedCampaignId,
            options: campaignFilterOptions,
            onChange: (next) => {
              setSelectedCampaignId(next);
              setCampaignBurstTrigger(`campaign:${next || 'all'}:${Date.now()}`);
              startFilterTransition();
            },
          },
        ]}
      />
      <FilterDrillBurst
        trigger={rangeBurstTrigger}
        accessibilityLabel="Filter applied"
      />
      <FilterDrillBurst
        trigger={clientBurstTrigger}
        accessibilityLabel="Client filter applied"
        source={lottieAssets.dataAnalyticsAndResearch}
      />
      <FilterDrillBurst
        trigger={campaignBurstTrigger}
        accessibilityLabel="Campaign filter applied"
        source={lottieAssets.dataExtraction}
      />
    </>
  );
}
