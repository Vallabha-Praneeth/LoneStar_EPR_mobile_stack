import type { AdminRouteRow } from '@/lib/api/admin/routes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { AdminHeader } from '@/components/admin-header';
import { AdminSettingsGearButton } from '@/components/admin-settings-gear';
import { EmptyStateWithAnimation } from '@/components/empty-state-with-animation';
import { emptyStatePresets, ListPaginationAnimation, lottieAssets } from '@/components/motion';
import { SearchBar } from '@/components/search-bar';
import { Switch, Text, View } from '@/components/ui';
import { ArrowRight, MapPin, Plus } from '@/components/ui/icons';
import {
  fetchAdminRoutes,
  toggleRouteActive,
} from '@/lib/api/admin/routes';

function RouteRow({
  item,
  onToggle,
  onOpen,
  togglePending,
}: {
  item: AdminRouteRow;
  onToggle: () => void;
  onOpen: () => void;
  togglePending: boolean;
}) {
  const stopCount = item.route_stops?.length ?? 0;

  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.7}
      className="mb-3 flex-row overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
    >
      <View className={`w-1 ${item.is_active ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'}`} />
      <View className="min-w-0 flex-1 p-4">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 text-[15px] font-semibold" numberOfLines={1}>{item.name}</Text>
          {!item.is_active && (
            <Text className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
              Inactive
            </Text>
          )}
        </View>
        <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
          {item.city && (
            <View className="flex-row items-center gap-1">
              <MapPin color="#a3a3a3" width={12} height={12} />
              <Text className="text-xs text-neutral-500">{item.city}</Text>
            </View>
          )}
          <Text className="text-xs text-neutral-500">
            {stopCount}
            {' '}
            {stopCount === 1 ? 'stop' : 'stops'}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2 pr-3">
        <Switch
          checked={item.is_active}
          onChange={onToggle}
          disabled={togglePending}
          accessibilityLabel={`Toggle active for ${item.name}`}
        />
        <ArrowRight color="#d4d4d4" width={16} height={16} />
      </View>
    </TouchableOpacity>
  );
}

export function RoutesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');

  const { data: routes = [], isLoading, error } = useQuery({
    queryKey: ['admin-routes'],
    queryFn: fetchAdminRoutes,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleRouteActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routes'] });
      showMessage({ message: 'Route status updated', type: 'success' });
    },
    onError: (err: Error) => showMessage({ message: err.message, type: 'danger' }),
  });

  const filtered = routes.filter((r) => {
    const q = search.toLowerCase();
    if (!q)
      return true;
    return r.name.toLowerCase().includes(q) || (r.city ?? '').toLowerCase().includes(q);
  });

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <AdminHeader title="Routes" showBack={false} right={<AdminSettingsGearButton />} />
      <View className="px-4 pt-3">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xs text-neutral-400">
            {routes.length}
            {' '}
            total ·
            {routes.filter(r => r.is_active).length}
            {' '}
            active
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/admin/route-form')}
            className="flex-row items-center gap-1 rounded-lg bg-primary px-3 py-1.5"
          >
            <Plus color="#fff" width={14} height={14} />
            <Text className="text-xs font-semibold text-white">Create</Text>
          </TouchableOpacity>
        </View>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or city..." />
      </View>

      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ListPaginationAnimation size={100} />
        </View>
      )}

      {error && !isLoading && (
        <View className="m-4 rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
          <Text className="text-sm text-red-700 dark:text-red-300">Failed to load routes.</Text>
        </View>
      )}

      {!isLoading && !error && (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <RouteRow
              item={item}
              onOpen={() => router.push(`/(app)/admin/route-form?id=${item.id}` as const)}
              onToggle={() => toggleMutation.mutate({ id: item.id, is_active: item.is_active })}
              togglePending={toggleMutation.isPending}
            />
          )}
          ListEmptyComponent={(
            <EmptyStateWithAnimation
              source={lottieAssets.adminEmptySearch}
              message={search ? 'No routes match your search.' : 'No routes yet.'}
              testID="admin-empty-routes"
              {...emptyStatePresets.adminCampaignList}
            />
          )}
        />
      )}
    </View>
  );
}
