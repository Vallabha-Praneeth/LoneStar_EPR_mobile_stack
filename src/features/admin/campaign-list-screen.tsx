import type { CampaignRow } from '@/lib/api/admin/campaigns';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { AppLogo } from '@/components/app-logo';
import { SearchBar } from '@/components/search-bar';
import { StatusBadge } from '@/components/status-badge';
import { Text, View } from '@/components/ui';
import { ArrowRight, Clock, LogOut, Truck, User } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchCampaigns } from '@/lib/api/admin/campaigns';

const STATUS_ACCENT: Record<string, string> = {
  active: 'bg-green-500',
  completed: 'bg-primary',
  pending: 'bg-amber-500',
  draft: 'bg-neutral-300',
};

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

  const activeCt = campaigns.filter(c => c.status === 'active').length;

  function renderItem({ item }: { item: CampaignRow }) {
    const accentColor = STATUS_ACCENT[item.status] ?? STATUS_ACCENT.draft;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(app)/admin/campaigns/${item.id}`)}
        activeOpacity={0.7}
        className="flex-row overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
      >
        <View className={`w-1 ${accentColor}`} />
        <View className="flex-1 p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="flex-1 text-[15px] font-semibold" numberOfLines={1}>{item.title}</Text>
            <StatusBadge status={item.status} />
          </View>
          <View className="flex-row flex-wrap items-center gap-3">
            <View className="flex-row items-center gap-1">
              <User color="#a3a3a3" width={12} height={12} />
              <Text className="text-xs text-neutral-500">{item.clients?.name ?? 'No client'}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Truck color="#a3a3a3" width={12} height={12} />
              <Text className="text-xs text-neutral-500">{item.driver_profile?.display_name ?? 'Unassigned'}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock color="#a3a3a3" width={12} height={12} />
              <Text className="text-xs text-neutral-500">
                {format(new Date(item.campaign_date), 'MMM d, yyyy')}
              </Text>
            </View>
          </View>
        </View>
        <View className="items-center justify-center pr-3">
          <ArrowRight color="#d4d4d4" width={16} height={16} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pt-14 pb-3 dark:border-neutral-700 dark:bg-neutral-800">
        <AppLogo size="sm" showText />
        <TouchableOpacity
          onPress={signOut}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
        >
          <LogOut color="#737373" width={18} height={18} />
        </TouchableOpacity>
      </View>

      <View className="px-4 pt-3">
        <View className="mb-1">
          <Text className="text-xs text-neutral-400">
            {campaigns.length}
            {' '}
            total ·
            {activeCt}
            {' '}
            active
          </Text>
        </View>
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
                  <Text className="text-sm text-neutral-500">No campaigns found</Text>
                </View>
              )}
            />
          )}
    </View>
  );
}
