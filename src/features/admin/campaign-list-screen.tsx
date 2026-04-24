import type { CampaignRow } from '@/lib/api/admin/campaigns';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { AdminHeader } from '@/components/admin-header';
import { AdminSettingsGearButton } from '@/components/admin-settings-gear';
import { EmptyStateWithAnimation } from '@/components/empty-state-with-animation';
import { emptyStatePresets, ListPaginationAnimation, lottieAssets, StatusIconAnimation } from '@/components/motion';
import { SearchBar } from '@/components/search-bar';
import { StatusBadge } from '@/components/status-badge';
import { Text, View } from '@/components/ui';
import { ArrowRight, Clock, LogOut, Truck, User } from '@/components/ui/icons';
import { Camera } from '@/components/ui/icons/camera';
import { DollarSign } from '@/components/ui/icons/dollar-sign';
import { uiPolishClasses, uiPolishStyles } from '@/components/ui/polish-system';
import { LogoutConfirmDialog } from '@/features/auth/components/logout-confirm-dialog';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchCampaigns } from '@/lib/api/admin/campaigns';

const STATUS_ACCENT: Record<string, string> = {
  active: 'bg-green-500',
  completed: 'bg-primary',
  overdue: 'bg-red-500',
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
      className="flex-row overflow-hidden rounded-2xl border border-neutral-200/75 bg-white/95 shadow-sm dark:border-neutral-700 dark:bg-neutral-800/95"
      style={styles.liquidCardShell}
    >
      <View pointerEvents="none" style={styles.cardTopSheen} />
      <View pointerEvents="none" style={styles.cardBottomDepth} />
      <View className={`w-1 ${accentColor}`} />
      <View className="flex-1 p-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="flex-1 text-[15px] font-semibold text-neutral-800 dark:text-neutral-100" numberOfLines={1}>{item.title}</Text>
          <StatusBadge status={item.status} />
        </View>
        <View className="flex-row flex-wrap items-center gap-3">
          <View className="flex-row items-center gap-1">
            <User color="#a3a3a3" width={12} height={12} />
            <Text className="text-[12px] font-normal text-neutral-500">{item.clients?.name ?? 'No client'}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Truck color="#a3a3a3" width={12} height={12} />
            <Text className="text-[12px] font-normal text-neutral-500">{item.driver_profile?.display_name ?? 'Unassigned'}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Clock color="#a3a3a3" width={12} height={12} />
            <Text className="text-[12px] font-normal text-neutral-500">
              {format(new Date(`${item.campaign_date}T12:00:00`), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>
        <View className="mt-1.5 flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Camera color="#a3a3a3" width={12} height={12} />
            <Text className="text-[12px] font-normal text-neutral-500">
              {item.campaign_photos?.length ?? 0}
              {' '}
              {(item.campaign_photos?.length ?? 0) === 1 ? 'photo' : 'photos'}
            </Text>
          </View>
          {cost > 0 && (
            <View className="flex-row items-center gap-1">
              <DollarSign color="#a3a3a3" width={12} height={12} />
              <Text className="text-[12px] font-normal text-neutral-500">
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

const styles = StyleSheet.create({
  liquidCardShell: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  cardTopSheen: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  cardBottomDepth: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 12,
    backgroundColor: 'rgba(15,23,42,0.05)',
  },
});

export function CampaignListScreen() {
  const router = useRouter();
  const signOut = useAuthStore.use.signOut();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
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
    <View className={uiPolishClasses.screenBg}>
      <AdminHeader
        title="Campaigns"
        showBack={false}
        right={(
          <View className="flex-row items-center gap-1">
            <AdminSettingsGearButton />
            <TouchableOpacity
              testID="sign-out-button"
              accessibilityLabel="Sign out"
              onPress={() => setConfirmOpen(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className={uiPolishClasses.headerIconButton}
            >
              <LogOut color="#737373" width={18} height={18} />
            </TouchableOpacity>
          </View>
        )}
      />

      <View className={uiPolishClasses.sectionWrap}>
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
              contentContainerStyle={uiPolishStyles.listContent}
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
      <LogoutConfirmDialog
        visible={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          signOut();
        }}
      />
    </View>
  );
}
