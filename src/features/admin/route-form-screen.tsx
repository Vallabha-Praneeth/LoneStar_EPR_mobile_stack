import type { RouteDetail } from '@/lib/api/admin/routes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { showMessage } from 'react-native-flash-message';
import { AdminHeader } from '@/components/admin-header';
import { Button, Switch, Text, View } from '@/components/ui';
import { Plus } from '@/components/ui/icons';
import { deleteRoute, fetchRouteById, upsertRoute } from '@/lib/api/admin/routes';

type StopDraft = { key: string; venue_name: string; address: string };

function newStopKey(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function stopsFromRoute(d: RouteDetail): StopDraft[] {
  return d.route_stops.map(s => ({
    key: s.id,
    venue_name: s.venue_name,
    address: s.address ?? '',
  }));
}

function buildInitialStops(route: RouteDetail | undefined): StopDraft[] {
  if (!route)
    return [];
  return stopsFromRoute(route);
}

function StopRowEditor({
  index,
  stop,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  index: number;
  stop: StopDraft;
  total: number;
  onChange: (field: 'venue_name' | 'address', v: string) => void;
  onRemove: () => void;
  onMove: (dir: 'up' | 'down') => void;
}) {
  return (
    <View className="mb-3 flex-row items-start gap-2">
      <Text className="w-6 pt-2 text-sm text-neutral-500">{index + 1}</Text>
      <View className="min-w-0 flex-1 gap-2">
        <View className="rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
          <TextInput
            value={stop.venue_name}
            onChangeText={t => onChange('venue_name', t)}
            placeholder="Stop name"
            placeholderTextColor="#a3a3a3"
            className="text-base text-neutral-900 dark:text-neutral-100"
          />
        </View>
        <View className="rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
          <TextInput
            value={stop.address}
            onChangeText={t => onChange('address', t)}
            placeholder="Address (optional)"
            placeholderTextColor="#a3a3a3"
            className="text-base text-neutral-900 dark:text-neutral-100"
          />
        </View>
      </View>
      <View className="gap-1">
        <TouchableOpacity
          disabled={index === 0}
          onPress={() => onMove('up')}
          className="rounded-sm bg-neutral-100 px-2 py-1 dark:bg-neutral-700"
        >
          <Text className="text-xs">↑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={index === total - 1}
          onPress={() => onMove('down')}
          className="rounded-sm bg-neutral-100 px-2 py-1 dark:bg-neutral-700"
        >
          <Text className="text-xs">↓</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onRemove} className="pt-2">
        <Text className="text-xs font-medium text-red-600">✕</Text>
      </TouchableOpacity>
    </View>
  );
}

type RouteFormEditorProps = {
  routeId: string | undefined;
  isEdit: boolean;
  initialName: string;
  initialCity: string;
  initialActive: boolean;
  initialStops: StopDraft[];
};

function RouteDetailsCard({
  name,
  city,
  isActive,
  setName,
  setCity,
  setIsActive,
}: {
  name: string;
  city: string;
  isActive: boolean;
  setName: (t: string) => void;
  setCity: (t: string) => void;
  setIsActive: (v: boolean) => void;
}) {
  return (
    <View className="mb-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <Text className="mb-3 font-semibold">Route details</Text>
      <Text className="mb-1 text-xs text-neutral-500">Name</Text>
      <View className="mb-3 rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-700">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Downtown Loop"
          placeholderTextColor="#a3a3a3"
          className="text-base text-neutral-900 dark:text-neutral-100"
        />
      </View>
      <Text className="mb-1 text-xs text-neutral-500">City (optional)</Text>
      <View className="mb-3 rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-700">
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Houston"
          placeholderTextColor="#a3a3a3"
          className="text-base text-neutral-900 dark:text-neutral-100"
        />
      </View>
      <View className="flex-row items-center gap-3">
        <Text className="text-sm text-neutral-600 dark:text-neutral-400">Active route</Text>
        <Switch
          checked={isActive}
          onChange={setIsActive}
          accessibilityLabel="Route active"
        />
      </View>
    </View>
  );
}

function RouteStopsCard({
  stops,
  onAddStop,
  onUpdateStop,
  onRemoveStop,
  onMoveStop,
}: {
  stops: StopDraft[];
  onAddStop: () => void;
  onUpdateStop: (i: number, f: 'venue_name' | 'address', v: string) => void;
  onRemoveStop: (i: number) => void;
  onMoveStop: (i: number, dir: 'up' | 'down') => void;
}) {
  return (
    <View className="mb-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-semibold">
          Stops (
          {stops.length}
          )
        </Text>
        <TouchableOpacity onPress={onAddStop} className="flex-row items-center gap-1 rounded-lg border border-neutral-300 px-2 py-1 dark:border-neutral-600">
          <Plus color="#525252" width={14} height={14} />
          <Text className="text-xs font-medium">Add</Text>
        </TouchableOpacity>
      </View>
      {stops.length === 0 && (
        <Text className="py-4 text-center text-sm text-neutral-500">No stops yet.</Text>
      )}
      {stops.map((s, i) => (
        <StopRowEditor
          key={s.key}
          index={i}
          stop={s}
          total={stops.length}
          onChange={(f, v) => onUpdateStop(i, f, v)}
          onRemove={() => onRemoveStop(i)}
          onMove={dir => onMoveStop(i, dir)}
        />
      ))}
    </View>
  );
}

function DeleteRouteButton({ routeId, routeName }: { routeId: string; routeName: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteRoute(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routes'] });
      queryClient.invalidateQueries({ queryKey: ['route-edit', routeId] });
      showMessage({ message: 'Route deleted', type: 'success' });
      router.back();
    },
    onError: (err: Error) => showMessage({ message: err.message, type: 'danger' }),
  });

  function confirmDelete() {
    Alert.alert(
      'Delete Route',
      `Remove "${routeName || 'this route'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ],
    );
  }

  return (
    <TouchableOpacity
      onPress={confirmDelete}
      disabled={deleteMutation.isPending}
      activeOpacity={0.7}
      className="mt-3 items-center rounded-xl border border-red-200 bg-red-50 py-3 dark:border-red-900/40 dark:bg-red-950/30"
    >
      <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
        {deleteMutation.isPending ? 'Deleting…' : 'Delete Route'}
      </Text>
    </TouchableOpacity>
  );
}

function RouteFormEditor({
  routeId,
  isEdit,
  initialName,
  initialCity,
  initialActive,
  initialStops,
}: RouteFormEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = React.useState(initialName);
  const [city, setCity] = React.useState(initialCity);
  const [isActive, setIsActive] = React.useState(initialActive);
  const [stops, setStops] = React.useState<StopDraft[]>(initialStops);

  const mutation = useMutation({
    mutationFn: async () => {
      const n = name.trim();
      if (!n)
        throw new Error('Route name is required');
      await upsertRoute({
        routeId: isEdit ? routeId : undefined,
        name: n,
        city: city.trim() || null,
        isActive,
        stops: stops.map(s => ({
          venue_name: s.venue_name,
          address: s.address.trim() || null,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routes'] });
      queryClient.invalidateQueries({ queryKey: ['route-edit', routeId] });
      showMessage({ message: isEdit ? 'Route updated' : 'Route created', type: 'success' });
      router.back();
    },
    onError: (err: Error) => showMessage({ message: err.message, type: 'danger' }),
  });

  function addStop() {
    setStops(prev => [...prev, { key: newStopKey(), venue_name: '', address: '' }]);
  }

  function removeStop(i: number) {
    setStops(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateStop(i: number, field: 'venue_name' | 'address', v: string) {
    setStops(prev => prev.map((s, idx) => (idx === i ? { ...s, [field]: v } : s)));
  }

  function moveStop(index: number, dir: 'up' | 'down') {
    setStops((prev) => {
      const arr = [...prev];
      const t = dir === 'up' ? index - 1 : index + 1;
      if (t < 0 || t >= arr.length)
        return prev;
      [arr[index], arr[t]] = [arr[t], arr[index]];
      return arr;
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <ScrollView className="flex-1 px-4 pb-8" keyboardShouldPersistTaps="handled">
        <RouteDetailsCard
          name={name}
          city={city}
          isActive={isActive}
          setName={setName}
          setCity={setCity}
          setIsActive={setIsActive}
        />
        <RouteStopsCard
          stops={stops}
          onAddStop={addStop}
          onUpdateStop={updateStop}
          onRemoveStop={removeStop}
          onMoveStop={moveStop}
        />

        <Button
          label={mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create route'}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
        />
        {isEdit && routeId && (
          <DeleteRouteButton routeId={routeId} routeName={name.trim()} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function RouteFormScreen() {
  const { id: routeId } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!routeId;
  const routeQuery = useQuery({
    queryKey: ['route-edit', routeId],
    queryFn: () => fetchRouteById(routeId!),
    enabled: isEdit,
  });

  if (isEdit && routeQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isEdit && routeQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <Text className="text-sm text-red-600 dark:text-red-400">Failed to load route.</Text>
      </View>
    );
  }

  const r = routeQuery.data;
  const formKey = isEdit ? `${routeId}-${routeQuery.dataUpdatedAt}` : 'create';

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <AdminHeader title={isEdit ? 'Edit Route' : 'Create Route'} />
      <RouteFormEditor
        key={formKey}
        routeId={routeId}
        isEdit={isEdit}
        initialName={r?.name ?? ''}
        initialCity={r?.city ?? ''}
        initialActive={r?.is_active ?? true}
        initialStops={buildInitialStops(r)}
      />
    </View>
  );
}
