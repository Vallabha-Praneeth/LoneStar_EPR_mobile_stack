import type { UserRow } from '@/lib/api/admin/users';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import * as React from 'react';

import { ActivityIndicator, Alert, FlatList, TouchableOpacity } from 'react-native';
import { SearchBar } from '@/components/search-bar';
import { Text, View } from '@/components/ui';
import { fetchUsers, toggleUserActive } from '@/lib/api/admin/users';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 dark:bg-purple-900',
  driver: 'bg-blue-100 dark:bg-blue-900',
  client: 'bg-green-100 dark:bg-green-900',
};

const ROLE_TEXT: Record<string, string> = {
  admin: 'text-purple-700 dark:text-purple-300',
  driver: 'text-blue-700 dark:text-blue-300',
  client: 'text-green-700 dark:text-green-300',
};

function UserCard({
  item,
  onToggle,
  isPending,
}: {
  item: UserRow;
  onToggle: (user: UserRow) => void;
  isPending: boolean;
}) {
  const roleBg = ROLE_COLORS[item.role] ?? 'bg-neutral-100';
  const roleText = ROLE_TEXT[item.role] ?? 'text-neutral-600';

  return (
    <View className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-2">
          <Text className="font-semibold" numberOfLines={1}>{item.display_name}</Text>
          <View className={`rounded-full px-2 py-0.5 ${roleBg}`}>
            <Text className={`text-xs font-medium capitalize ${roleText}`}>{item.role}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => onToggle(item)} disabled={isPending}>
          <View
            className={`rounded-full px-2 py-0.5 ${item.is_active ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}
          >
            <Text
              className={`text-xs font-medium ${item.is_active ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
            >
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      <Text className="text-sm text-neutral-500">
        @
        {item.username}
      </Text>
      {item.clients?.name && (
        <Text className="mt-1 text-xs text-neutral-400">
          Client:
          {' '}
          {item.clients.name}
        </Text>
      )}
      <Text className="mt-1 text-xs text-neutral-400">
        Joined
        {' '}
        {format(new Date(item.created_at), 'MMM d, yyyy')}
      </Text>
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
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pt-14 pb-3 dark:border-neutral-700 dark:bg-neutral-800">
        <View className="flex-row items-center gap-2">
          <View className="size-7 items-center justify-center rounded-lg bg-primary">
            <Text className="text-xs font-bold text-white">AD</Text>
          </View>
          <Text className="text-base font-semibold">Users</Text>
        </View>
      </View>

      <View className="px-4 pt-3">
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
              contentContainerStyle={{ padding: 16, gap: 12 }}
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
