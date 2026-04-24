import type { AdminRouteRow } from '@/lib/api/admin/routes';
import type { ClientOption, DriverOption } from '@/lib/api/admin/selectors';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as React from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { AdminHeader } from '@/components/admin-header';
import { AdminSettingsGearButton } from '@/components/admin-settings-gear';
import { CampaignCreatedAnimation } from '@/components/motion';
import { Text, View } from '@/components/ui';
import { Modal, useModal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { createCampaign } from '@/lib/api/admin/campaigns';
import { fetchAdminRoutes } from '@/lib/api/admin/routes';
import { fetchClients, fetchDrivers } from '@/lib/api/admin/selectors';
import { createClientUser, createDriver } from '@/lib/api/admin/users';

function FormField({
  label,
  children,
  right,
}: {
  label: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <View>
      <View className="mb-1.5 flex-row items-center justify-between gap-3">
        <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

function FormInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  secureTextEntry,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
  secureTextEntry?: boolean;
}) {
  return (
    <View className="rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a3a3a3"
        style={{ fontSize: 16, minHeight: multiline ? 80 : undefined }}
        className="text-neutral-900 dark:text-white"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : undefined}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

function CssTrackToggle({
  checked,
  onCheckedChange,
  accessibilityLabel,
  testID,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  accessibilityLabel: string;
  testID?: string;
}) {
  const width = 72;
  const height = 40;
  const padding = 4;
  const thumbSize = height - padding * 2;

  return (
    <TouchableOpacity
      onPress={() => onCheckedChange(!checked)}
      activeOpacity={0.9}
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={{ width, height }}
    >
      <View
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 999,
          backgroundColor: checked ? '#FF6C00' : '#2a2f3a',
        }}
      />
      <MotiView
        style={{
          position: 'absolute',
          top: padding,
          left: padding,
          width: thumbSize,
          height: thumbSize,
          borderRadius: 999,
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.45,
          shadowRadius: 6,
          elevation: 3,
        }}
        animate={{
          translateX: checked ? width - height : 0,
        }}
        transition={{
          type: 'timing',
          duration: 260,
        }}
      />
      {checked && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: padding,
            left: padding,
            width: thumbSize,
            height: thumbSize,
            borderRadius: 999,
            transform: [{ translateX: width - height }],
            shadowColor: '#FF6C00',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

function SelectorList<T extends { id: string }>({
  items,
  selectedId,
  onSelect,
  labelKey,
  labelFormatter,
}: {
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  labelKey: keyof T;
  labelFormatter?: (item: T) => string;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        const label = labelFormatter ? labelFormatter(item) : String(item[labelKey]);
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelect(isSelected ? '' : item.id)}
            className={`rounded-full border px-3 py-1.5 ${
              isSelected
                ? 'border-primary bg-primary/10'
                : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'
            }`}
          >
            <Text
              className={`text-sm ${isSelected ? 'font-medium text-primary' : 'text-neutral-700 dark:text-neutral-300'}`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
      {items.length === 0 && (
        <Text className="text-sm text-neutral-400">None available</Text>
      )}
    </View>
  );
}

type FormState = {
  title: string;
  campaignDate: string;
  clientId: string;
  driverProfileId: string;
  routeId: string;
  clientBilledAmount: string;
  internalNotes: string;
  driverCanModifyRoute: boolean;
};

function QuickCreateDriverForm({
  onCreated,
}: {
  onCreated: (driverId: string) => void;
}) {
  const [username, setUsername] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createDriver,
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      setUsername('');
      setDisplayName('');
      setPassword('');
      onCreated(user.id);
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
            : <Text className="font-semibold text-white">Create Driver</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function QuickCreateClientUserForm({
  clients,
  onCreated,
}: {
  clients: ClientOption[];
  onCreated: (clientId: string) => void;
}) {
  const [email, setEmail] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [clientId, setClientId] = React.useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createClientUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEmail('');
      setDisplayName('');
      setPassword('');
      setClientId('');
      onCreated(clientId);
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
          <SelectorList items={clients} selectedId={clientId} onSelect={setClientId} labelKey="name" />
        </FormField>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={mutation.isPending}
          className="mt-2 h-12 items-center justify-center rounded-xl bg-primary disabled:opacity-50"
        >
          {mutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text className="font-semibold text-white">Create Client User</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// eslint-disable-next-line max-lines-per-function
function CampaignFormBody({
  form,
  setField,
  clients,
  drivers,
  routes,
  loadingClients,
  loadingDrivers,
  loadingRoutes,
  onQuickAddDriver,
  onQuickAddClientUser,
  onCreateRoute,
  isPending: _isPending,
}: {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, val: FormState[K]) => void;
  clients: ClientOption[];
  drivers: DriverOption[];
  routes: AdminRouteRow[];
  loadingClients: boolean;
  loadingDrivers: boolean;
  loadingRoutes: boolean;
  onQuickAddDriver: () => void;
  onQuickAddClientUser: () => void;
  onCreateRoute: () => void;
  isPending: boolean;
}) {
  const activeRoutes = routes.filter(r => r.is_active);
  const clientOptions = clients.map(client => ({
    value: client.id,
    label: client.name,
  }));
  const driverOptions = [
    { value: '', label: 'Unassigned' },
    ...drivers.map(driver => ({
      value: driver.id,
      label: driver.display_name,
    })),
  ];
  const routeOptions = activeRoutes.map(route => ({
    value: route.id,
    label: route.city ? `${route.name} (${route.city})` : route.name,
  }));
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <FormField label="Title *">
        <FormInput value={form.title} onChangeText={v => setField('title', v)} placeholder="Campaign title" />
      </FormField>

      <FormField label="Campaign Date *">
        <FormInput value={form.campaignDate} onChangeText={v => setField('campaignDate', v)} placeholder="YYYY-MM-DD" />
      </FormField>

      <FormField
        label="Client *"
        right={(
          <TouchableOpacity
            onPress={onQuickAddClientUser}
            activeOpacity={0.8}
            className="rounded-lg border border-primary px-2.5 py-1"
          >
            <Text className="text-[11px] font-semibold text-primary">Quick Add User</Text>
          </TouchableOpacity>
        )}
      >
        {loadingClients
          ? <ActivityIndicator size="small" />
          : (
              <Select
                testID="campaign-client-select"
                value={form.clientId || undefined}
                placeholder="Select a client"
                options={clientOptions}
                onSelect={(value) => {
                  setField('clientId', value ? String(value) : '');
                }}
              />
            )}
      </FormField>

      <FormField
        label="Driver"
        right={(
          <TouchableOpacity
            onPress={onQuickAddDriver}
            activeOpacity={0.8}
            className="rounded-lg border border-primary px-2.5 py-1"
          >
            <Text className="text-[11px] font-semibold text-primary">Quick Add User</Text>
          </TouchableOpacity>
        )}
      >
        {loadingDrivers
          ? <ActivityIndicator size="small" />
          : (
              <Select
                testID="campaign-driver-select"
                value={form.driverProfileId}
                placeholder="Select a driver"
                options={driverOptions}
                onSelect={(value) => {
                  setField('driverProfileId', String(value));
                }}
              />
            )}
      </FormField>

      <FormField
        label="Route"
        right={(
          <TouchableOpacity
            onPress={onCreateRoute}
            activeOpacity={0.8}
            className="rounded-lg border border-primary px-2.5 py-1"
          >
            <Text className="text-[11px] font-semibold text-primary">+ New Route</Text>
          </TouchableOpacity>
        )}
      >
        {loadingRoutes
          ? <ActivityIndicator size="small" />
          : (
              <Select
                testID="campaign-route-select"
                value={form.routeId || undefined}
                placeholder="Select a route"
                options={routeOptions}
                onSelect={(value) => {
                  setField('routeId', value ? String(value) : '');
                }}
              />
            )}
      </FormField>

      <FormField label="Client Billed Amount">
        <FormInput value={form.clientBilledAmount} onChangeText={v => setField('clientBilledAmount', v)} placeholder="0.00" keyboardType="numeric" />
      </FormField>

      <FormField label="Internal Notes">
        <FormInput value={form.internalNotes} onChangeText={v => setField('internalNotes', v)} placeholder="Optional notes..." multiline />
      </FormField>

      <View className="flex-row items-start justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
        <View className="flex-1">
          <Text className="text-sm font-medium text-neutral-900 dark:text-white">
            Let driver reorder & skip stops
          </Text>
          <Text className="mt-1 text-xs text-neutral-500">
            When off, the driver follows the route in order and cannot skip stops.
          </Text>
        </View>
        <CssTrackToggle
          checked={form.driverCanModifyRoute}
          onCheckedChange={v => setField('driverCanModifyRoute', v)}
          accessibilityLabel="Let driver reorder and skip stops"
          testID="driver-can-modify-route-toggle"
        />
      </View>

      <View className="pt-2 pb-4" />
    </ScrollView>
  );
}

// eslint-disable-next-line max-lines-per-function
export function CreateCampaignScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const profile = useAuthStore.use.profile();
  const createDriverModal = useModal();
  const createClientUserModal = useModal();

  const [form, setForm] = React.useState<FormState>({
    title: '',
    campaignDate: '',
    clientId: '',
    driverProfileId: '',
    routeId: '',
    clientBilledAmount: '',
    internalNotes: '',
    driverCanModifyRoute: false,
  });

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  const { data: clients = [], isLoading: loadingClients } = useQuery({ queryKey: ['admin-clients'], queryFn: fetchClients });
  const { data: drivers = [], isLoading: loadingDrivers } = useQuery({ queryKey: ['admin-drivers'], queryFn: fetchDrivers });
  const { data: routes = [], isLoading: loadingRoutes } = useQuery({ queryKey: ['admin-routes'], queryFn: fetchAdminRoutes });

  const mutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['driver-campaign'] });
      Alert.alert('Success', 'Campaign created', [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  function handleSubmit() {
    if (!form.title.trim())
      return Alert.alert('Validation', 'Title is required');
    if (!form.campaignDate.trim())
      return Alert.alert('Validation', 'Campaign date is required (YYYY-MM-DD)');
    if (!form.clientId)
      return Alert.alert('Validation', 'Please select a client');

    const billedNum = Number.parseFloat(form.clientBilledAmount);

    mutation.mutate({
      title: form.title.trim(),
      campaign_date: form.campaignDate.trim(),
      client_id: form.clientId,
      driver_profile_id: form.driverProfileId || null,
      route_id: form.routeId || null,
      internal_notes: form.internalNotes.trim() || null,
      client_billed_amount: !Number.isNaN(billedNum) && billedNum > 0 ? billedNum : null,
      driver_can_modify_route: form.driverCanModifyRoute,
      created_by: profile?.id ?? '',
      status: 'draft',
    });
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <AdminHeader
        title="Create Campaign"
        right={(
          <View className="flex-row items-center gap-2">
            <AdminSettingsGearButton />
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={mutation.isPending}
              activeOpacity={0.7}
              className="rounded-lg bg-primary px-4 py-1.5 disabled:opacity-50"
            >
              {mutation.isPending
                ? <CampaignCreatedAnimation size={22} />
                : <Text className="text-sm font-semibold text-white">Save</Text>}
            </TouchableOpacity>
          </View>
        )}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <CampaignFormBody
          form={form}
          setField={setField}
          clients={clients}
          drivers={drivers}
          routes={routes}
          loadingClients={loadingClients}
          loadingDrivers={loadingDrivers}
          loadingRoutes={loadingRoutes}
          onQuickAddDriver={() => createDriverModal.present()}
          onQuickAddClientUser={() => createClientUserModal.present()}
          onCreateRoute={() => router.push('/(app)/admin/routes')}
          isPending={mutation.isPending}
        />
      </KeyboardAvoidingView>
      <Modal ref={createDriverModal.ref} title="Create Driver" snapPoints={['55%']}>
        <QuickCreateDriverForm
          onCreated={(driverId) => {
            setField('driverProfileId', driverId);
            createDriverModal.dismiss();
          }}
        />
      </Modal>
      <Modal ref={createClientUserModal.ref} title="Create Client User" snapPoints={['70%']}>
        <QuickCreateClientUserForm
          clients={clients}
          onCreated={(clientId) => {
            setField('clientId', clientId);
            createClientUserModal.dismiss();
          }}
        />
      </Modal>
    </View>
  );
}
