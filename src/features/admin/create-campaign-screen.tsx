import type { ClientOption, DriverOption, RouteOption } from '@/lib/api/admin/selectors';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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
import { Text, View } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { createCampaign } from '@/lib/api/admin/campaigns';
import { fetchClients, fetchDrivers, fetchRoutes } from '@/lib/api/admin/selectors';

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="mb-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</Text>
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
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
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
      />
    </View>
  );
}

function SelectorList<T extends { id: string }>({
  items,
  selectedId,
  onSelect,
  labelKey,
}: {
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  labelKey: keyof T;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => {
        const isSelected = item.id === selectedId;
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
              {String(item[labelKey])}
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
  internalNotes: string;
  clientBilledAmount: string;
};

function CampaignFormBody({
  form,
  setField,
  clients,
  drivers,
  routes,
  loadingClients,
  loadingDrivers,
  loadingRoutes,
}: {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, val: FormState[K]) => void;
  clients: ClientOption[];
  drivers: DriverOption[];
  routes: RouteOption[];
  loadingClients: boolean;
  loadingDrivers: boolean;
  loadingRoutes: boolean;
}) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <FormField label="Title *">
        <FormInput value={form.title} onChangeText={v => setField('title', v)} placeholder="Campaign title" />
      </FormField>

      <FormField label="Campaign Date *">
        <FormInput value={form.campaignDate} onChangeText={v => setField('campaignDate', v)} placeholder="YYYY-MM-DD" />
      </FormField>

      <FormField label="Client *">
        {loadingClients
          ? <ActivityIndicator size="small" />
          : <SelectorList items={clients} selectedId={form.clientId} onSelect={v => setField('clientId', v)} labelKey="name" />}
      </FormField>

      <FormField label="Driver">
        {loadingDrivers
          ? <ActivityIndicator size="small" />
          : <SelectorList items={drivers} selectedId={form.driverProfileId} onSelect={v => setField('driverProfileId', v)} labelKey="display_name" />}
      </FormField>

      <FormField label="Route">
        {loadingRoutes
          ? <ActivityIndicator size="small" />
          : <SelectorList items={routes} selectedId={form.routeId} onSelect={v => setField('routeId', v)} labelKey="name" />}
      </FormField>

      <FormField label="Client Billed Amount">
        <FormInput value={form.clientBilledAmount} onChangeText={v => setField('clientBilledAmount', v)} placeholder="0" keyboardType="numeric" />
      </FormField>

      <FormField label="Internal Notes">
        <FormInput value={form.internalNotes} onChangeText={v => setField('internalNotes', v)} placeholder="Optional notes..." multiline />
      </FormField>
    </ScrollView>
  );
}

export function CreateCampaignScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const profile = useAuthStore.use.profile();

  const [form, setForm] = React.useState<FormState>({
    title: '',
    campaignDate: '',
    clientId: '',
    driverProfileId: '',
    routeId: '',
    internalNotes: '',
    clientBilledAmount: '',
  });

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  const { data: clients = [], isLoading: loadingClients } = useQuery({ queryKey: ['admin-clients'], queryFn: fetchClients });
  const { data: drivers = [], isLoading: loadingDrivers } = useQuery({ queryKey: ['admin-drivers'], queryFn: fetchDrivers });
  const { data: routes = [], isLoading: loadingRoutes } = useQuery({ queryKey: ['admin-routes'], queryFn: fetchRoutes });

  const mutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
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

    mutation.mutate({
      title: form.title.trim(),
      campaign_date: form.campaignDate.trim(),
      client_id: form.clientId,
      driver_profile_id: form.driverProfileId || null,
      route_id: form.routeId || null,
      internal_notes: form.internalNotes.trim() || null,
      client_billed_amount: form.clientBilledAmount ? Number(form.clientBilledAmount) : null,
      created_by: profile?.id ?? '',
      status: 'draft',
    });
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <AdminHeader
        title="Create Campaign"
        showBack={false}
        right={(
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={mutation.isPending}
            activeOpacity={0.7}
            className="rounded-lg bg-primary px-4 py-1.5 disabled:opacity-50"
          >
            {mutation.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text className="text-sm font-semibold text-white">Save</Text>}
          </TouchableOpacity>
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
        />
      </KeyboardAvoidingView>
    </View>
  );
}
