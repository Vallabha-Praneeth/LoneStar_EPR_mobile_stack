import type { CampaignRow } from '@/lib/api/admin/campaigns';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { FlatList, TouchableOpacity } from 'react-native';
import { AdminSettingsGearButton } from '@/components/admin-settings-gear';
import { AppLogo } from '@/components/app-logo';
import { EmptyStateWithAnimation } from '@/components/empty-state-with-animation';
import { emptyStatePresets, ListPaginationAnimation, lottieAssets, StatusIconAnimation } from '@/components/motion';
import { SearchBar } from '@/components/search-bar';
import { StatusBadge } from '@/components/status-badge';
import { Text, View } from '@/components/ui';
import { ArrowRight, Clock, LogOut, Truck, User } from '@/components/ui/icons';
import { Camera } from '@/components/ui/icons/camera';
import { DollarSign } from '@/components/ui/icons/dollar-sign';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchCampaigns } from '@/lib/api/admin/campaigns';

const STATUS_ACCENT: Record<string, string> = {
  active: 'bg-green-500',
  completed: 'bg-primary',
  pending: 'bg-amber-500',
  draft: 'bg-neutral-300',
};

function totalCost(c: CampaignRow): number {
  return (c.campaign_costs ?? []).reduce((sum, cc) => sum + cc.amount, 0);
}

function CampaignCard({ item, onPress }: { item: CampaignRow; onPress: () => void }) {
  const accentColor = STATUS_ACCENT[item.status] ?? STATUS_ACCENT.draft;
  const cost = totalCost(item);

  return (
    <TouchableOpacity
      onPress={onPress}
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
              {format(new Date(`${item.campaign_date}T12:00:00`), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>
        <View className="mt-1.5 flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Camera color="#a3a3a3" width={12} height={12} />
            <Text className="text-xs text-neutral-500">
              {item.campaign_photos?.length ?? 0}
              {' '}
              {(item.campaign_photos?.length ?? 0) === 1 ? 'photo' : 'photos'}
            </Text>
          </View>
          {cost > 0 && (
            <View className="flex-row items-center gap-1">
              <DollarSign color="#a3a3a3" width={12} height={12} />
              <Text className="text-xs text-neutral-500">
                {cost.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View className="items-center justify-center pr-3">
        <ArrowRight color="#d4d4d4" width={16} height={16} />
      </View>
    </TouchableOpacity>
  );
}

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

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pt-14 pb-3 dark:border-neutral-700 dark:bg-neutral-800">
        <AppLogo size="sm" showText />
        <View className="flex-row items-center gap-1">
          <AdminSettingsGearButton />
          <TouchableOpacity
            testID="sign-out-button"
            accessibilityLabel="Sign out"
            onPress={signOut}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
          >
            <LogOut color="#737373" width={18} height={18} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-4 pt-3">
        <View className="mb-1 flex-row items-center gap-2">
          <StatusIconAnimation size={18} />
          <Text className="text-xs text-neutral-400">
            {campaigns.length}
            {' '}
            total ·
            {campaigns.filter(c => c.status === 'active').length}
            {' '}
            active
          </Text>
        </View>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search campaigns..." />
      </View>

      {isLoading
        ? (
            <View className="flex-1 items-center justify-center">
              <ListPaginationAnimation size={100} />
            </View>
          )
        : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <CampaignCard item={item} onPress={() => router.push(`/(app)/admin/campaigns/${item.id}`)} />
              )}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              ListEmptyComponent={(
                <EmptyStateWithAnimation
                  source={lottieAssets.adminEmptySearch}
                  message="No campaigns found"
                  testID="admin-empty-campaign-animation"
                  {...emptyStatePresets.adminCampaignList}
                />
              )}
            />
          )}
    </View>
  );
}
