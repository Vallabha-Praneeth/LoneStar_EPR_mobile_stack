import type { BarDatum } from '@/components/ui/horizontal-bar-chart';
import type { AnalyticsRange } from '@/lib/analytics';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import * as React from 'react';
import { View } from 'react-native';
import { ExportSuccessBurst, FilterDrillBurst } from '@/components/motion';
import { lottieAssets } from '@/components/motion/lottie-assets';
import { Camera, CheckCircle, Clock, Truck, Users } from '@/components/ui/icons';
import { showErrorMessage } from '@/components/ui/utils';
import { RoleAnalyticsScreen } from '@/features/analytics/role-analytics-screen';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { formatHours, formatNumber } from '@/lib/analytics';
import {
  getClientAnalyticsFilterOptions,
  getClientAnalyticsSummary,
  getClientCampaignBreakdown,
} from '@/lib/analytics/role-queries';
import { useFilterTransition } from '@/lib/hooks/use-filter-transition';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { exportReportsCsvForTab } from '@/lib/reports/tab-report-export-flow';

// eslint-disable-next-line max-lines-per-function
export function ClientAnalyticsScreen() {
  const router = useRouter();
  const profile = useAuthStore.use.profile();
  const clientId = profile?.client_id ?? undefined;
  const reducedMotion = useReducedMotion();
  const [range, setRange] = React.useState<AnalyticsRange>('1w');
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>('');
  const [burstVisible, setBurstVisible] = React.useState(false);
  const { isTransitioning: isFilterTransitioning, startTransition: startFilterTransition } = useFilterTransition({ durationMs: 700 });
  const hasHandledInitialRangeRef = React.useRef(false);
  const filterKey = React.useMemo(
    () => `range:${range}|campaign:${selectedCampaignId || 'all'}`,
    [range, selectedCampaignId],
  );

  React.useEffect(() => {
    if (!hasHandledInitialRangeRef.current) {
      hasHandledInitialRangeRef.current = true;
      return;
    }
    startFilterTransition();
  }, [range, startFilterTransition]);

  const summaryQ = useQuery({
    queryKey: ['client-analytics-summary', clientId, range, selectedCampaignId],
    queryFn: () =>
      getClientAnalyticsSummary(clientId!, range, {
        campaignId: selectedCampaignId || undefined,
      }),
    enabled: !!clientId,
  });
  const campaignsQ = useQuery({
    queryKey: ['client-analytics-campaigns', clientId, range, selectedCampaignId],
    queryFn: () =>
      getClientCampaignBreakdown(clientId!, range, {
        campaignId: selectedCampaignId || undefined,
      }),
    enabled: !!clientId,
  });
  const filterOptionsQ = useQuery({
    queryKey: ['client-analytics-filter-options', clientId, range],
    queryFn: () => getClientAnalyticsFilterOptions(clientId!, range),
    enabled: !!clientId,
  });

  const campaignFilterOptions = React.useMemo(
    () => [
      { label: 'All campaigns', value: '' },
      ...(filterOptionsQ.data?.campaigns ?? []).map(campaign => ({
        label: campaign.title,
        value: campaign.id,
      })),
    ],
    [filterOptionsQ.data?.campaigns],
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

  const photoBars: BarDatum[] = (campaignsQ.data ?? []).map(campaign => ({
    label: campaign.campaignTitle,
    value: campaign.photoCount,
    formattedValue: formatNumber(campaign.photoCount),
  }));
  const shiftBars: BarDatum[] = (campaignsQ.data ?? []).map(campaign => ({
    label: campaign.campaignTitle,
    value: campaign.shiftsObserved,
    formattedValue: formatNumber(campaign.shiftsObserved),
  }));
  const exportRows = React.useMemo(
    () =>
      (campaignsQ.data ?? []).map(campaign => ({
        campaignTitle: campaign.campaignTitle,
        rangeLabel: range.toUpperCase(),
        photoCount: campaign.photoCount,
        shiftCount: campaign.shiftsObserved,
        workedHours: campaign.workedHours,
      })),
    [campaignsQ.data, range],
  );

  const exportMutation = useMutation({
    mutationFn: () => exportReportsCsvForTab({ scope: 'client', rows: exportRows }),
    onSuccess: () => {
      setBurstVisible(true);
    },
    onError: () => {
      showErrorMessage('Unable to export reports right now');
    },
  });

  const cards = summary
    ? [
        {
          label: 'Campaigns',
          value: formatNumber(summary.totalCampaigns),
          icon: <Truck color="#d97706" width={14} height={14} />,
          iconBg: 'bg-amber-50 dark:bg-amber-950/40',
          valueColor: 'text-amber-700 dark:text-amber-400',
        },
        {
          label: 'In Flight',
          value: formatNumber(summary.activeCampaigns),
          icon: <Users color="#0891b2" width={14} height={14} />,
          iconBg: 'bg-cyan-50 dark:bg-cyan-950/40',
          valueColor: 'text-cyan-700 dark:text-cyan-400',
        },
        {
          label: 'Completed',
          value: formatNumber(summary.completedCampaigns),
          icon: <CheckCircle color="#16a34a" width={14} height={14} />,
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
          valueColor: 'text-emerald-700 dark:text-emerald-400',
        },
        {
          label: 'Photos',
          value: formatNumber(summary.totalPhotos),
          icon: <Camera color="#1d4ed8" width={14} height={14} />,
          iconBg: 'bg-blue-50 dark:bg-blue-950/40',
          valueColor: 'text-blue-700 dark:text-blue-400',
        },
        {
          label: 'Shifts',
          value: formatNumber(summary.shiftsObserved),
          icon: <Clock color="#dc2626" width={14} height={14} />,
          iconBg: 'bg-red-50 dark:bg-red-950/40',
          valueColor: 'text-red-700 dark:text-red-400',
        },
        {
          label: 'Hours',
          value: formatHours(summary.workedHours),
          icon: <Truck color="#7c3aed" width={14} height={14} />,
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
                  source={lottieAssets.clientAnalyticsHero}
                  autoPlay
                  loop
                  style={{ width: '100%', height: 208, alignSelf: 'center' }}
                />
              </View>
            </View>
          )
        : null}
      <RoleAnalyticsScreen
        testID="client-analytics-screen"
        title="Client analytics"
        range={range}
        onRangeChange={setRange}
        onBack={() => router.back()}
        onExportCsv={() => exportMutation.mutate()}
        isExportingCsv={exportMutation.isPending}
        disableExportCsv={exportRows.length === 0}
        cards={cards}
        primarySection={{
          title: 'Top Campaigns by Photos',
          data: photoBars,
          barColor: '#3b82f6',
        }}
        secondarySection={{
          title: 'Top Campaigns by Shifts',
          data: shiftBars,
          barColor: '#22c55e',
        }}
        isLoading={summaryQ.isLoading || campaignsQ.isLoading}
        isError={summaryQ.isError || campaignsQ.isError}
        hasData={hasData}
        emptyMessage="No client campaign data for this period"
        suppressContent={isFilterTransitioning}
        extraFilters={[
          {
            id: 'client-campaign-filter',
            label: 'Campaign',
            value: selectedCampaignId,
            options: campaignFilterOptions,
            onChange: (next) => {
              setSelectedCampaignId(next);
              startFilterTransition();
            },
          },
        ]}
      />
      <FilterDrillBurst
        trigger={filterKey}
        accessibilityLabel="Filter applied"
      />
      <ExportSuccessBurst visible={burstVisible} onHide={() => setBurstVisible(false)} />
    </>
  );
}
