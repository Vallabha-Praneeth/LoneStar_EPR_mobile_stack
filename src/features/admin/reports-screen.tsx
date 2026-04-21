import type { ReportCampaign } from '@/lib/api/admin/reports';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import * as React from 'react';

import { FlatList, Pressable } from 'react-native';
import { AdminHeader } from '@/components/admin-header';
import { AdminSettingsGearButton } from '@/components/admin-settings-gear';
import { EmptyStateWithAnimation } from '@/components/empty-state-with-animation';
import {
  BudgetIndicatorAnimation,
  emptyStatePresets,
  ExportSuccessBurst,
  lottieAssets,
} from '@/components/motion';
import { SearchBar } from '@/components/search-bar';
import { StatusBadge } from '@/components/status-badge';
import { Card, Text, View } from '@/components/ui';
import { BarChart, Camera, Clock, Share as ShareIcon } from '@/components/ui/icons';
import { LiquidIconBadge } from '@/components/ui/liquid-icon-badge';
import { uiPolishClasses, uiPolishStyles } from '@/components/ui/polish-system';
import { showErrorMessage } from '@/components/ui/utils';
import { fetchReportData } from '@/lib/api/admin/reports';
import { exportReportsCsvForTab } from '@/lib/reports/tab-report-export-flow';

type StatCardProps = {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  valueColor?: string;
};

function StatCard({ value, label, icon, valueColor }: StatCardProps) {
  return (
    <Card className="flex-1 rounded-2xl border-neutral-200/85 p-3">
      <View className="mb-2">
        <LiquidIconBadge size={28} radius={10}>{icon}</LiquidIconBadge>
      </View>
      <Text className={`text-lg font-bold ${valueColor ?? ''}`}>{value}</Text>
      <Text className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">{label}</Text>
    </Card>
  );
}

function ReportCampaignCard({ item }: { item: ReportCampaign }) {
  const photos = item.campaign_photos.length;
  const shifts = item.driver_shifts.length;

  return (
    <Card className="rounded-2xl border-neutral-200/85 p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="flex-1 text-[15px] font-semibold" numberOfLines={1}>{item.title}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text className="text-sm text-neutral-500">
        {item.clients?.name ?? 'No client'}
        {' · '}
        {item.driver_profile?.display_name ?? 'Unassigned'}
      </Text>
      <Text className="mt-1 text-xs text-neutral-400">
        {format(new Date(item.campaign_date), 'MMM d, yyyy')}
      </Text>
      <View className="mt-3 flex-row gap-4 border-t border-neutral-100 pt-3 dark:border-neutral-700">
        <View className="flex-row items-center gap-1.5">
          <Camera color="#a3a3a3" width={12} height={12} />
          <Text className="text-sm font-semibold">{photos}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Clock color="#a3a3a3" width={12} height={12} />
          <Text className="text-sm font-semibold">{shifts}</Text>
        </View>
      </View>
    </Card>
  );
}

// eslint-disable-next-line max-lines-per-function
export function ReportsScreen() {
  const [search, setSearch] = React.useState('');
  const [burstVisible, setBurstVisible] = React.useState(false);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: fetchReportData,
  });

  const filtered = campaigns.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q)
      || c.clients?.name.toLowerCase().includes(q)
      || c.driver_profile?.display_name.toLowerCase().includes(q)
    );
  });

  const totalPhotos = filtered.reduce((sum, c) => sum + c.campaign_photos.length, 0);
  const totalShifts = filtered.reduce((sum, c) => sum + c.driver_shifts.length, 0);
  const exportRows = React.useMemo(
    () =>
      filtered.map(campaign => ({
        campaignTitle: campaign.title,
        clientName: campaign.clients?.name ?? 'No client',
        driverName: campaign.driver_profile?.display_name ?? 'Unassigned',
        campaignDate: format(new Date(`${campaign.campaign_date}T12:00:00`), 'MMM d, yyyy'),
        status: campaign.status,
        photoCount: campaign.campaign_photos.length,
        shiftCount: campaign.driver_shifts.length,
      })),
    [filtered],
  );

  const exportMutation = useMutation({
    mutationFn: () => exportReportsCsvForTab({ scope: 'admin', rows: exportRows }),
    onSuccess: () => {
      setBurstVisible(true);
    },
    onError: () => {
      showErrorMessage('Unable to export reports right now');
    },
  });

  return (
    <View testID="reports-screen" className={uiPolishClasses.screenBg}>
      <AdminHeader
        title="Reports"
        showBack={false}
        right={(
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Export reports as CSV"
              disabled={exportMutation.isPending || exportRows.length === 0}
              onPress={() => exportMutation.mutate()}
              className={`flex-row items-center gap-1 rounded-lg px-2 py-1.5 ${
                exportMutation.isPending || exportRows.length === 0
                  ? 'bg-neutral-200 dark:bg-neutral-700'
                  : 'bg-primary/10 dark:bg-primary/20'
              }`}
            >
              <ShareIcon width={14} height={14} />
              <Text className="text-xs font-semibold text-primary dark:text-primary-300">
                {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
              </Text>
            </Pressable>
            <AdminSettingsGearButton />
          </View>
        )}
      />

      <View className={uiPolishClasses.sectionWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search campaigns..." />
      </View>

      <View className="flex-row gap-2 px-4 pt-3">
        <StatCard
          value={filtered.length}
          label="Campaigns"
          icon={<BarChart color="#1d4ed8" width={14} height={14} />}
          valueColor="text-primary"
        />
        <StatCard
          value={totalPhotos}
          label="Photos"
          icon={<Camera color="#d97706" width={14} height={14} />}
          valueColor="text-amber-700"
        />
        <StatCard
          value={totalShifts}
          label="Shifts"
          icon={<Clock color="#7c3aed" width={14} height={14} />}
          valueColor="text-violet-700"
        />
      </View>

      {isLoading
        ? (
            <View className="flex-1 items-center justify-center">
              <BudgetIndicatorAnimation width={200} height={100} />
            </View>
          )
        : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <ReportCampaignCard item={item} />}
              contentContainerStyle={uiPolishStyles.listContent}
              ListEmptyComponent={(
                <EmptyStateWithAnimation
                  source={lottieAssets.adminEmptySearch}
                  message="No campaigns found"
                  testID="admin-reports-empty-animation"
                  {...emptyStatePresets.adminReports}
                />
              )}
            />
          )}
      <ExportSuccessBurst visible={burstVisible} onHide={() => setBurstVisible(false)} />
    </View>
  );
}
