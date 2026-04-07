import type { ReportCampaign } from '@/lib/api/admin/reports';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import * as React from 'react';

import { ActivityIndicator, FlatList } from 'react-native';
import { AppLogo } from '@/components/app-logo';
import { EmptyStateWithAnimation } from '@/components/empty-state-with-animation';
import { emptyStatePresets, lottieAssets } from '@/components/motion';
import { SearchBar } from '@/components/search-bar';
import { StatusBadge } from '@/components/status-badge';
import { Text, View } from '@/components/ui';
import { BarChart, Camera, Clock } from '@/components/ui/icons';
import { fetchReportData } from '@/lib/api/admin/reports';

type StatCardProps = {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
};

function StatCard({ value, label, icon, iconBg, valueColor }: StatCardProps) {
  return (
    <View className="flex-1 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
      <View className={`mb-2 size-7 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </View>
      <Text className={`text-lg font-bold ${valueColor ?? ''}`}>{value}</Text>
      <Text className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">{label}</Text>
    </View>
  );
}

function ReportCampaignCard({ item }: { item: ReportCampaign }) {
  const photos = item.campaign_photos.length;
  const shifts = item.driver_shifts.length;

  return (
    <View className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
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
    </View>
  );
}

export function ReportsScreen() {
  const [search, setSearch] = React.useState('');

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

  return (
    <View testID="reports-screen" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pt-14 pb-3 dark:border-neutral-700 dark:bg-neutral-800">
        <AppLogo size="sm" showText />
      </View>

      <View className="px-4 pt-3">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search campaigns..." />
      </View>

      <View className="flex-row gap-2 px-4 pt-3">
        <StatCard
          value={filtered.length}
          label="Campaigns"
          icon={<BarChart color="#1d4ed8" width={14} height={14} />}
          iconBg="bg-primary/10"
          valueColor="text-primary"
        />
        <StatCard
          value={totalPhotos}
          label="Photos"
          icon={<Camera color="#d97706" width={14} height={14} />}
          iconBg="bg-amber-50"
          valueColor="text-amber-700"
        />
        <StatCard
          value={totalShifts}
          label="Shifts"
          icon={<Clock color="#7c3aed" width={14} height={14} />}
          iconBg="bg-violet-50"
          valueColor="text-violet-700"
        />
      </View>

      {isLoading
        ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" />
            </View>
          )
        : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <ReportCampaignCard item={item} />}
              contentContainerStyle={{ padding: 16, gap: 12 }}
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
    </View>
  );
}
