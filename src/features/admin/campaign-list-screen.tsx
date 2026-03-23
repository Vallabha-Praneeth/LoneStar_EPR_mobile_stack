import type { CampaignRow } from '@/lib/api/admin/campaigns';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { SearchBar } from '@/components/search-bar';
import { StatusBadge } from '@/components/status-badge';
import { Text, View } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchCampaigns } from '@/lib/api/admin/campaigns';

export function CampaignListScreen() {
  const router = useRouter();
  const signOut = useAuthStore.use.signOut();
  const [search, setSearch] = React.useState('');

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: fetchCampaigns,
  });

  const filtered = campaigns.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q)
      || c.clients?.name.toLowerCase().includes(q)
      || c.driver_profile?.display_name.toLowerCase().includes(q)
    );
  });

  function renderItem({ item }: { item: CampaignRow }) {
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(app)/admin/campaigns/${item.id}`)}
        className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      >
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="flex-1 font-semibold" numberOfLines={1}>{item.title}</Text>
          <StatusBadge status={item.status} />
        </View>
        <Text className="text-sm text-gray-500">
          {item.clients?.name ?? 'No client'}
          {' '}
          •
          {item.driver_profile?.display_name ?? 'Unassigned'}
        </Text>
        <Text className="mt-1 text-xs text-gray-400">
          {format(new Date(item.campaign_date), 'MMM d, yyyy')}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 pt-14 pb-3 dark:border-gray-700 dark:bg-gray-800">
        <View className="flex-row items-center gap-2">
          <View className="size-7 items-center justify-center rounded-lg bg-primary">
            <Text className="text-xs font-bold text-white">AD</Text>
          </View>
          <Text className="text-base font-semibold">Campaigns</Text>
        </View>
        <TouchableOpacity onPress={signOut}>
          <Text className="text-sm text-gray-500">Sign out</Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 pt-3">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search campaigns..." />
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
              renderItem={renderItem}
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
