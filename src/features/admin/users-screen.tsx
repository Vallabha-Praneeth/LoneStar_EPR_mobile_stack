import type { UserRow } from '@/lib/api/admin/users';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import * as React from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { AdminHeader } from '@/components/admin-header';
import { AdminSettingsGearButton } from '@/components/admin-settings-gear';
import { SearchBar } from '@/components/search-bar';
import { Card, Text, View } from '@/components/ui';
import { Modal, useModal } from '@/components/ui/modal';
import { uiPolishClasses, uiPolishStyles } from '@/components/ui/polish-system';
import { fetchClients } from '@/lib/api/admin/selectors';
import { createClientUser, createDriver, fetchUsers, resetUserPassword, toggleUserActive } from '@/lib/api/admin/users';

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
  onResetPassword,
  isPending,
}: {
  item: UserRow;
  onToggle: (user: UserRow) => void;
  onResetPassword: (user: UserRow) => void;
  isPending: boolean;
}) {
  const roleBg = ROLE_COLORS[item.role] ?? 'bg-neutral-100';
  const roleText = ROLE_TEXT[item.role] ?? 'text-neutral-600';

  return (
    <Card className="rounded-2xl border-neutral-200/85 p-4">
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
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs text-neutral-400">
          Joined
          {' '}
          {format(new Date(item.created_at), 'MMM d, yyyy')}
        </Text>
        {item.role !== 'admin' && (
          <TouchableOpacity onPress={() => onResetPassword(item)}>
            <View className="rounded-lg border border-neutral-300 px-2.5 py-1 dark:border-neutral-600">
              <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-300">Reset PW</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="mb-1 text-xs font-medium text-neutral-500">{label}</Text>
      {children}
    </View>
  );
}

function FormInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}) {
  return (
    <View className="rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a3a3a3"
        style={{ fontSize: 16 }}
        className="text-neutral-900 dark:text-white"
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

function CreateDriverForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createDriver,
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      showMessage({ message: `Driver "${user.display_name}" created`, type: 'success' });
      setUsername('');
      setDisplayName('');
      setPassword('');
      onSuccess();
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  function handleSubmit() {
    const trimmedUsername = username.trim();
    const trimmedName = displayName.trim();

    if (!trimmedUsername)
      return Alert.alert('Validation', 'Username is required');
    if (!trimmedName)
      return Alert.alert('Validation', 'Display name is required');
    if (password.length < 6)
      return Alert.alert('Validation', 'Password must be at least 6 characters');

    mutation.mutate({
      username: trimmedUsername,
      display_name: trimmedName,
      password,
    });
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="gap-4 px-4 pb-8">
        <FormField label="Username *">
          <FormInput value={username} onChangeText={setUsername} placeholder="e.g. driver2" />
        </FormField>
        <FormField label="Display Name *">
          <FormInput value={displayName} onChangeText={setDisplayName} placeholder="e.g. John Smith" />
        </FormField>
        <FormField label="Password *">
          <FormInput value={password} onChangeText={setPassword} placeholder="Min 6 characters" secureTextEntry />
        </FormField>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={mutation.isPending}
          className="mt-2 h-12 items-center justify-center rounded-xl bg-primary disabled:opacity-50"
        >
          {mutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text className="font-semibold text-white">Add Driver</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function ClientSelector({
  clients,
  selectedId,
  onSelect,
  isLoading: loading,
}: {
  clients: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
}) {
  if (loading) {
    return <ActivityIndicator size="small" />;
  }
  if (clients.length === 0) {
    return <Text className="text-sm text-neutral-400">No active clients</Text>;
  }
  return (
    <View className="flex-row flex-wrap gap-2">
      {clients.map((c) => {
        const isSelected = c.id === selectedId;
        return (
          <TouchableOpacity
            key={c.id}
            onPress={() => onSelect(isSelected ? '' : c.id)}
            className={`rounded-full border px-3 py-1.5 ${
              isSelected
                ? 'border-primary bg-primary/10'
                : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'
            }`}
          >
            <Text
              className={`text-sm ${isSelected ? 'font-medium text-primary' : 'text-neutral-700 dark:text-neutral-300'}`}
            >
              {c.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function CreateClientUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [clientId, setClientId] = React.useState('');
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: fetchClients,
  });

  const mutation = useMutation({
    mutationFn: createClientUser,
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showMessage({ message: `Client user "${user.display_name}" created`, type: 'success' });
      setEmail('');
      setDisplayName('');
      setPassword('');
      setClientId('');
      onSuccess();
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  function handleSubmit() {
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();

    if (!trimmedEmail)
      return Alert.alert('Validation', 'Email is required');
    if (!trimmedName)
      return Alert.alert('Validation', 'Display name is required');
    if (password.length < 6)
      return Alert.alert('Validation', 'Password must be at least 6 characters');
    if (!clientId)
      return Alert.alert('Validation', 'Please select a client organization');

    mutation.mutate({
      email: trimmedEmail,
      display_name: trimmedName,
      password,
      client_id: clientId,
    });
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="gap-4 px-4 pb-8">
        <FormField label="Email *">
          <FormInput value={email} onChangeText={setEmail} placeholder="e.g. contact@acme.com" />
        </FormField>
        <FormField label="Display Name *">
          <FormInput value={displayName} onChangeText={setDisplayName} placeholder="e.g. Jane Doe" />
        </FormField>
        <FormField label="Password *">
          <FormInput value={password} onChangeText={setPassword} placeholder="Min 6 characters" secureTextEntry />
        </FormField>
        <FormField label="Client Organization *">
          <ClientSelector clients={clients} selectedId={clientId} onSelect={setClientId} isLoading={clientsLoading} />
        </FormField>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={mutation.isPending}
          className="mt-2 h-12 items-center justify-center rounded-xl bg-primary disabled:opacity-50"
        >
          {mutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text className="font-semibold text-white">Add Client User</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function ResetPasswordForm({ user, onSuccess }: { user: UserRow; onSuccess: () => void }) {
  const [password, setPassword] = React.useState('');

  const mutation = useMutation({
    mutationFn: (newPassword: string) => resetUserPassword(user.id, newPassword),
    onSuccess: () => {
      showMessage({ message: `Password reset for ${user.display_name}`, type: 'success' });
      setPassword('');
      onSuccess();
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  function handleSubmit() {
    if (password.length < 6)
      return Alert.alert('Validation', 'Password must be at least 6 characters');
    mutation.mutate(password);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="gap-4 px-4 pb-8">
        <View className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
          <Text className="text-sm font-medium">{user.display_name}</Text>
          <Text className="text-xs text-neutral-500">
            @
            {user.username}
            {' '}
            &middot;
            {user.role}
          </Text>
        </View>
        <FormField label="New Password *">
          <FormInput value={password} onChangeText={setPassword} placeholder="Min 6 characters" secureTextEntry />
        </FormField>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={mutation.isPending || password.length < 6}
          className="mt-2 h-12 items-center justify-center rounded-xl bg-primary disabled:opacity-50"
        >
          {mutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text className="font-semibold text-white">Reset Password</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// eslint-disable-next-line max-lines-per-function
export function UsersScreen() {
  const [search, setSearch] = React.useState('');
  const [resetTarget, setResetTarget] = React.useState<UserRow | null>(null);
  const queryClient = useQueryClient();
  const createDriverModal = useModal();
  const createClientUserModal = useModal();
  const resetPasswordModal = useModal();

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

  function handleResetPassword(user: UserRow) {
    setResetTarget(user);
    resetPasswordModal.present();
  }

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
    <View className={uiPolishClasses.screenBg}>
      <AdminHeader
        title="Users"
        showBack={false}
        right={(
          <View className="flex-row items-center gap-2">
            <AdminSettingsGearButton />
            <TouchableOpacity onPress={() => createClientUserModal.present()}>
              <View className="rounded-lg border border-primary px-3 py-1.5">
                <Text className="text-xs font-semibold text-primary">+ Client</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => createDriverModal.present()}>
              <View className="rounded-lg bg-primary px-3 py-1.5">
                <Text className="text-xs font-semibold text-white">+ Driver</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      />

      <View className={uiPolishClasses.sectionWrap}>
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
                <UserCard item={item} onToggle={handleToggle} onResetPassword={handleResetPassword} isPending={toggleMutation.isPending} />
              )}
              contentContainerStyle={uiPolishStyles.listContent}
              ListEmptyComponent={(
                <View className="items-center py-16">
                  <Text className="text-sm text-neutral-500">No users found</Text>
                </View>
              )}
            />
          )}

      <Modal ref={createDriverModal.ref} title="Add New Driver" snapPoints={['55%']}>
        <CreateDriverForm onSuccess={() => createDriverModal.dismiss()} />
      </Modal>

      <Modal ref={createClientUserModal.ref} title="Add Client User" snapPoints={['70%']}>
        <CreateClientUserForm onSuccess={() => createClientUserModal.dismiss()} />
      </Modal>

      <Modal ref={resetPasswordModal.ref} title="Reset Password" snapPoints={['45%']}>
        {resetTarget && (
          <ResetPasswordForm
            user={resetTarget}
            onSuccess={() => {
              resetPasswordModal.dismiss();
              setResetTarget(null);
            }}
          />
        )}
      </Modal>
    </View>
  );
}
