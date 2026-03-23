import type { ReportCampaign } from '@/lib/api/admin/reports';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import * as React from 'react';

import { ActivityIndicator, FlatList } from 'react-native';
import { SearchBar } from '@/components/search-bar';
import { StatusBadge } from '@/components/status-badge';
import { Text, View } from '@/components/ui';
import { fetchReportData } from '@/lib/api/admin/reports';

function StatCard({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <View className="flex-1 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <Text className={`text-lg font-bold ${color ?? ''}`}>{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  );
}

function ReportCampaignCard({ item }: { item: ReportCampaign }) {
  const photos = item.campaign_photos.length;
  const approved = item.campaign_photos.filter(p => p.status === 'approved').length;
  const shifts = item.driver_shifts.length;

  return (
    <View className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="flex-1 font-semibold" numberOfLines={1}>{item.title}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text className="text-sm text-gray-500">
        {item.clients?.name ?? 'No client'}
        {' • '}
        {item.driver_profile?.display_name ?? 'Unassigned'}
      </Text>
      <Text className="mt-1 text-xs text-gray-400">
        {format(new Date(item.campaign_date), 'MMM d, yyyy')}
      </Text>
      <View className="mt-3 flex-row gap-4 border-t border-gray-100 pt-3 dark:border-gray-700">
        <View className="items-center">
          <Text className="text-sm font-semibold">{photos}</Text>
          <Text className="text-xs text-gray-500">Photos</Text>
        </View>
        <View className="items-center">
          <Text className="text-sm font-semibold text-green-600">{approved}</Text>
          <Text className="text-xs text-gray-500">Approved</Text>
        </View>
        <View className="items-center">
          <Text className="text-sm font-semibold">{shifts}</Text>
          <Text className="text-xs text-gray-500">Shifts</Text>
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
  const approvedPhotos = filtered.reduce(
    (sum, c) => sum + c.campaign_photos.filter(p => p.status === 'approved').length,
    0,
  );
  const totalShifts = filtered.reduce((sum, c) => sum + c.driver_shifts.length, 0);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 pt-14 pb-3 dark:border-gray-700 dark:bg-gray-800">
        <View className="flex-row items-center gap-2">
          <View className="size-7 items-center justify-center rounded-lg bg-primary">
            <Text className="text-xs font-bold text-white">AD</Text>
          </View>
          <Text className="text-base font-semibold">Reports</Text>
        </View>
      </View>

      <View className="px-4 pt-3">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search campaigns..." />
      </View>

      <View className="flex-row gap-3 px-4 pt-3">
        <StatCard value={filtered.length} label="Campaigns" />
        <StatCard value={totalPhotos} label="Photos" />
        <StatCard value={approvedPhotos} label="Approved" color="text-green-600" />
        <StatCard value={totalShifts} label="Shifts" />
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
                <View className="items-center py-16">
                  <Text className="text-sm text-gray-500">No campaigns found</Text>
                </View>
              )}
            />
          )}
    </View>
  );
}
