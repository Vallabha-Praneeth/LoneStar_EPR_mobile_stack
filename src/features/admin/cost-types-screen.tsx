import type { CostTypeRow } from '@/lib/api/admin/cost-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { AdminHeader } from '@/components/admin-header';
import { EmptyStateWithAnimation } from '@/components/empty-state-with-animation';
import { emptyStatePresets, lottieAssets } from '@/components/motion';
import { Switch, Text, View } from '@/components/ui';
import { Plus } from '@/components/ui/icons';
import {
  createCostType,
  deleteCostType,
  fetchCostTypes,
  updateCostTypeActive,
  updateCostTypeName,
} from '@/lib/api/admin/cost-types';

function CostTypeRowItem({
  item,
  isEditing,
  draftName,
  onDraftName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggle,
  onDelete,
  togglePending,
}: {
  item: CostTypeRow;
  isEditing: boolean;
  draftName: string;
  onDraftName: (t: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  togglePending: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-neutral-200 px-4 py-3.5 dark:border-neutral-700">
      <View className="min-w-0 flex-1 flex-row items-center gap-2 pr-2">
        {isEditing
          ? (
              <View className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-2 py-1.5 dark:border-neutral-600">
                <TextInput
                  value={draftName}
                  onChangeText={onDraftName}
                  className="text-[15px] text-neutral-900 dark:text-neutral-100"
                  placeholderTextColor="#a3a3a3"
                />
              </View>
            )
          : (
              <Text
                className={`text-[15px] font-medium ${
                  item.is_active
                    ? 'text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-400 line-through dark:text-neutral-500'
                }`}
              >
                {item.name}
              </Text>
            )}
        {!item.is_active && !isEditing && (
          <Text className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
            Inactive
          </Text>
        )}
      </View>
      <View className="flex-row items-center gap-2">
        {isEditing
          ? (
              <>
                <TouchableOpacity onPress={onSaveEdit}>
                  <Text className="text-xs font-semibold text-primary">Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onCancelEdit}>
                  <Text className="text-xs text-neutral-500">Cancel</Text>
                </TouchableOpacity>
              </>
            )
          : (
              <>
                <TouchableOpacity onPress={onStartEdit}>
                  <Text className="text-xs font-medium text-primary">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete}>
                  <Text className="text-xs font-medium text-red-600 dark:text-red-400">Delete</Text>
                </TouchableOpacity>
                <Switch
                  checked={item.is_active}
                  onChange={onToggle}
                  disabled={togglePending}
                  accessibilityLabel={`Toggle ${item.name}`}
                />
              </>
            )}
      </View>
    </View>
  );
}

function CostTypesCreateBar({
  newName,
  onNewName,
  onAdd,
  pending,
}: {
  newName: string;
  onNewName: (t: string) => void;
  onAdd: () => void;
  pending: boolean;
}) {
  return (
    <View className="px-4 py-3">
      <Text className="mb-3 text-sm text-neutral-500">
        Categories for campaign cost breakdowns. Amounts are stored in dollars.
      </Text>
      <View className="flex-row gap-2">
        <View className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
          <TextInput
            value={newName}
            onChangeText={onNewName}
            placeholder="New cost type name"
            placeholderTextColor="#a3a3a3"
            className="text-base text-neutral-900 dark:text-neutral-100"
          />
        </View>
        <TouchableOpacity
          onPress={onAdd}
          disabled={pending || !newName.trim()}
          className="flex-row items-center gap-1 rounded-xl bg-primary px-4 py-2 disabled:opacity-50"
        >
          {pending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Plus color="#fff" width={16} height={16} />}
          <Text className="font-semibold text-white">Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

type ListProps = {
  costTypes: CostTypeRow[];
  editingId: string | null;
  editName: string;
  setEditName: (t: string) => void;
  setEditingId: (id: string | null) => void;
  startEdit: (ct: CostTypeRow) => void;
  saveEdit: () => void;
  toggleMutationPending: boolean;
  onToggle: (item: CostTypeRow) => void;
  onDelete: (id: string, name: string) => void;
};

function CostTypesList({
  costTypes,
  editingId,
  editName,
  setEditName,
  setEditingId,
  startEdit,
  saveEdit,
  toggleMutationPending,
  onToggle,
  onDelete,
}: ListProps) {
  return (
    <FlatList
      data={costTypes}
      keyExtractor={item => item.id}
      contentContainerStyle={{ paddingBottom: 32 }}
      ListEmptyComponent={(
        <EmptyStateWithAnimation
          source={lottieAssets.adminEmptySearch}
          message="No cost types yet. Add one above."
          testID="admin-empty-cost-types"
          {...emptyStatePresets.adminCampaignList}
        />
      )}
      renderItem={({ item }) => (
        <CostTypeRowItem
          item={item}
          isEditing={editingId === item.id}
          draftName={editName}
          onDraftName={setEditName}
          onStartEdit={() => startEdit(item)}
          onSaveEdit={saveEdit}
          onCancelEdit={() => setEditingId(null)}
          onToggle={() => onToggle(item)}
          onDelete={() => onDelete(item.id, item.name)}
          togglePending={toggleMutationPending}
        />
      )}
    />
  );
}

export function CostTypesScreen() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');

  const { data: costTypes = [], isLoading, error } = useQuery({
    queryKey: ['admin-cost-types'],
    queryFn: fetchCostTypes,
  });

  const createMutation = useMutation({
    mutationFn: createCostType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cost-types'] });
      setNewName('');
      showMessage({ message: 'Cost type created', type: 'success' });
    },
    onError: (err: Error) => showMessage({ message: err.message, type: 'danger' }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateCostTypeActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cost-types'] });
      showMessage({ message: 'Cost type updated', type: 'success' });
    },
    onError: (err: Error) => showMessage({ message: err.message, type: 'danger' }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateCostTypeName(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cost-types'] });
      setEditingId(null);
      showMessage({ message: 'Name saved', type: 'success' });
    },
    onError: (err: Error) => showMessage({ message: err.message, type: 'danger' }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCostType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cost-types'] });
      showMessage({ message: 'Cost type deleted', type: 'success' });
    },
    onError: (err: Error) => showMessage({ message: err.message, type: 'danger' }),
  });

  function confirmDelete(id: string, name: string) {
    Alert.alert('Delete cost type', `Remove "${name}"? Linked campaign costs may block this.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  }

  function startEdit(ct: CostTypeRow) {
    setEditingId(ct.id);
    setEditName(ct.name);
  }

  function saveEdit() {
    const t = editName.trim();
    if (!t || !editingId)
      return;
    renameMutation.mutate({ id: editingId, name: t });
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <AdminHeader title="Cost types" />
      <CostTypesCreateBar
        newName={newName}
        onNewName={setNewName}
        onAdd={() => newName.trim() && createMutation.mutate(newName.trim())}
        pending={createMutation.isPending}
      />

      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      )}

      {error && !isLoading && (
        <View className="m-4 rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
          <Text className="text-sm text-red-700 dark:text-red-300">Failed to load cost types.</Text>
        </View>
      )}

      {!isLoading && !error && (
        <CostTypesList
          costTypes={costTypes}
          editingId={editingId}
          editName={editName}
          setEditName={setEditName}
          setEditingId={setEditingId}
          startEdit={startEdit}
          saveEdit={saveEdit}
          toggleMutationPending={toggleMutation.isPending}
          onToggle={item => toggleMutation.mutate({ id: item.id, is_active: item.is_active })}
          onDelete={confirmDelete}
        />
      )}
    </View>
  );
}
