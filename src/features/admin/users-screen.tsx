import type { UserRow } from '@/lib/api/admin/users';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import * as React from 'react';

import { ActivityIndicator, Alert, FlatList, TouchableOpacity } from 'react-native';
import { AppLogo } from '@/components/app-logo';
import { SearchBar } from '@/components/search-bar';
import { Text, View } from '@/components/ui';
import { fetchUsers, toggleUserActive } from '@/lib/api/admin/users';

const ROLE_CONFIG: Record<string, { bg: string; text: string; avatarBg: string; avatarText: string }> = {
  admin: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    avatarBg: 'bg-primary/15',
    avatarText: 'text-primary',
  },
  driver: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    avatarBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    avatarText: 'text-emerald-700 dark:text-emerald-400',
  },
  client: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    avatarBg: 'bg-amber-100 dark:bg-amber-900/30',
    avatarText: 'text-amber-700 dark:text-amber-400',
  },
};

const DEFAULT_ROLE = ROLE_CONFIG.client;

function UserCard({
  item,
  onToggle,
  isPending,
}: {
  item: UserRow;
  onToggle: (user: UserRow) => void;
  isPending: boolean;
}) {
  const rc = ROLE_CONFIG[item.role] ?? DEFAULT_ROLE;

  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      {/* Avatar */}
      <View className={`size-10 items-center justify-center rounded-full ${rc.avatarBg}`}>
        <Text className={`text-sm font-bold ${rc.avatarText}`}>
          {item.display_name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-[15px] font-semibold" numberOfLines={1}>{item.display_name}</Text>
          <View className={`rounded-full px-2 py-0.5 ${rc.bg}`}>
            <Text className={`text-[11px] font-medium capitalize ${rc.text}`}>{item.role}</Text>
          </View>
          {!item.is_active && (
            <View className="rounded-full bg-red-100 px-2 py-0.5 dark:bg-red-900/30">
              <Text className="text-[11px] font-medium text-red-600 dark:text-red-400">Inactive</Text>
            </View>
          )}
        </View>
        <View className="mt-0.5 flex-row flex-wrap gap-x-2">
          <Text className="text-xs text-neutral-500">
            @
            {item.username}
          </Text>
          {item.clients?.name && (
            <Text className="text-xs text-neutral-400">
              ·
              {item.clients.name}
            </Text>
          )}
          <Text className="text-xs text-neutral-400">
            · Joined
            {' '}
            {format(new Date(item.created_at), 'MMM d, yyyy')}
          </Text>
        </View>
      </View>

      {/* Toggle */}
      <TouchableOpacity
        onPress={() => onToggle(item)}
        disabled={isPending || item.role === 'admin'}
        activeOpacity={0.7}
        className={`rounded-lg border px-3 py-1.5 ${
          item.is_active
            ? 'border-red-200 dark:border-red-800'
            : 'border-green-200 dark:border-green-800'
        } ${item.role === 'admin' ? 'opacity-30' : ''}`}
      >
        <Text className={`text-xs font-medium ${
          item.is_active
            ? 'text-red-600 dark:text-red-400'
            : 'text-green-600 dark:text-green-400'
        }`}
        >
          {item.is_active ? 'Deactivate' : 'Activate'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function UsersScreen() {
  const [search, setSearch] = React.useState('');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      toggleUserActive(userId, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.display_name.toLowerCase().includes(q)
      || u.username.toLowerCase().includes(q)
      || u.role.toLowerCase().includes(q)
      || u.clients?.name?.toLowerCase().includes(q)
    );
  });

  const roleCounts = React.useMemo(() => {
    const counts = { admin: 0, driver: 0, client: 0 };
    users.forEach((u) => {
      if (u.role in counts)
        counts[u.role as keyof typeof counts]++;
    });
    return counts;
  }, [users]);

  function handleToggle(user: UserRow) {
    Alert.alert(
      user.is_active ? 'Deactivate User' : 'Activate User',
      `${user.is_active ? 'Deactivate' : 'Activate'} ${user.display_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => toggleMutation.mutate({ userId: user.id, isActive: user.is_active }) },
      ],
    );
  }

  return (
    <View testID="users-screen" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pt-14 pb-3 dark:border-neutral-700 dark:bg-neutral-800">
        <AppLogo size="sm" showText />
      </View>

      <View className="px-4 pt-3">
        <View className="mb-1">
          <Text className="text-xs text-neutral-400">
            {users.length}
            {' '}
            users ·
            {roleCounts.driver}
            {' '}
            drivers ·
            {roleCounts.client}
            {' '}
            clients ·
            {roleCounts.admin}
            {' '}
            admins
          </Text>
        </View>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search users..." />
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
              renderItem={({ item }) => (
                <UserCard item={item} onToggle={handleToggle} isPending={toggleMutation.isPending} />
              )}
              contentContainerStyle={{ padding: 16, gap: 10 }}
              ListEmptyComponent={(
                <View className="items-center py-16">
                  <Text className="text-sm text-neutral-500">No users found</Text>
                </View>
              )}
            />
          )}
    </View>
  );
}
