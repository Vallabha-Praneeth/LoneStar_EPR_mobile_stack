import type { CampaignDetail } from '@/lib/api/admin/campaigns';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, FlatList, Image, TouchableOpacity } from 'react-native';

import { AdminHeader } from '@/components/admin-header';
import { AdminSettingsGearButton } from '@/components/admin-settings-gear';
import { CampaignStageProgress } from '@/components/campaign-stage-progress';
import { DriverTransitBadge } from '@/components/driver-transit-badge';
import { InfoCard } from '@/components/info-card';
import { ApproveUnlockAnimation, CampaignMilestoneAnimation } from '@/components/motion';
import { StatusBadge } from '@/components/status-badge';
import { Card, Text, View } from '@/components/ui';
import { DollarSign, MapPin, Truck, User } from '@/components/ui/icons';
import { fetchCampaignDetail } from '@/lib/api/admin/campaigns';
import { getSignedUrl } from '@/lib/api/admin/photos';

function PhotosSectionHeader({ status, photoCount }: { status: string; photoCount: number }) {
  return (
    <>
      <View className="mt-3">
        <CampaignStageProgress status={status} />
      </View>
      {status === 'completed' && (
        <View className="mt-2 items-center">
          <CampaignMilestoneAnimation size={90} />
        </View>
      )}
      <View className="mt-3 flex-row items-center gap-2">
        <ApproveUnlockAnimation size={24} />
        <Text className="text-sm font-semibold">
          Photos (
          {photoCount}
          )
        </Text>
      </View>
    </>
  );
}

function CampaignInfoHeader({ campaign }: { campaign: CampaignDetail }) {
  const router = useRouter();
  const totalCost = (campaign.campaign_costs ?? []).reduce(
    (sum, c) => sum + (c.amount ?? 0),
    0,
  );
  const activeShift = campaign.driver_shifts.find(s => !s.ended_at);

  return (
    <View className="mb-2 gap-4">
      <View className="flex-row items-center gap-2">
        <StatusBadge status={campaign.status} />
        <Text className="text-sm text-neutral-500">
          {format(new Date(campaign.campaign_date), 'MMM d, yyyy')}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <InfoCard icon={<User color="#737373" width={16} height={16} />} label="Client" value={campaign.clients?.name ?? 'No client'} />
        </View>
        <View className="flex-1">
          {campaign.driver_profile_id
            ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push(
                      `/(app)/admin/driver-detail?profileId=${campaign.driver_profile_id}` as const,
                    )}
                  accessibilityLabel="Open driver details"
                >
                  <InfoCard
                    icon={<Truck color="#9A7B45" width={16} height={16} />}
                    label="Driver"
                    value={campaign.driver_profile?.display_name ?? 'Unassigned'}
                  />
                </TouchableOpacity>
              )
            : (
                <InfoCard
                  icon={<Truck color="#9A7B45" width={16} height={16} />}
                  label="Driver"
                  value={campaign.driver_profile?.display_name ?? 'Unassigned'}
                />
              )}
        </View>
      </View>

      {campaign.routes?.name && (
        <InfoCard icon={<MapPin color="#9A7B45" width={16} height={16} />} label="Route" value={campaign.routes.name} />
      )}

      {campaign.campaign_costs && campaign.campaign_costs.length > 0 && (
        <View className="gap-2">
          {campaign.campaign_costs.map(cost => (
            <View key={cost.id} className="flex-row gap-3">
              <View className="flex-1">
                <InfoCard icon={<DollarSign color="#737373" width={16} height={16} />} label={cost.cost_types?.name ?? 'Cost'} value={`$${cost.amount}`} />
              </View>
            </View>
          ))}
        </View>
      )}

      <InfoCard icon={<DollarSign color="#737373" width={16} height={16} />} label="Total Cost" value={`$${totalCost}`} />

      {campaign.internal_notes && (
        <Card className="rounded-xl p-4">
          <Text className="mb-1 text-xs text-neutral-500">Notes</Text>
          <Text className="text-sm">{campaign.internal_notes}</Text>
        </Card>
      )}

      {activeShift ? <DriverTransitBadge /> : null}

      {campaign.driver_shifts.length > 0 && (
        <Card className="rounded-xl p-4">
          <Text className="mb-2 text-xs text-neutral-500">Shifts</Text>
          {campaign.driver_shifts.map(shift => (
            <View key={shift.id} className="mb-1 flex-row items-center gap-2">
              <Text className="text-sm">
                {format(new Date(shift.started_at), 'h:mm a')}
              </Text>
              <Text className="text-xs text-neutral-400">→</Text>
              <Text className="text-sm">
                {shift.ended_at
                  ? format(new Date(shift.ended_at), 'h:mm a')
                  : 'In progress'}
              </Text>
            </View>
          ))}
        </Card>
      )}

      <PhotosSectionHeader status={campaign.status} photoCount={campaign.campaign_photos.length} />
    </View>
  );
}

function PhotoCard({
  photo,
}: {
  photo: { id: string; submitted_at: string; note: string | null; storage_path: string };
}) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    getSignedUrl(photo.storage_path).then(setUrl).catch(() => {});
  }, [photo.storage_path]);

  return (
    <View className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      {url
        ? (
            <Image source={{ uri: url }} className="h-48 w-full" resizeMode="cover" />
          )
        : (
            <View className="h-48 w-full items-center justify-center bg-neutral-100 dark:bg-neutral-700">
              <ActivityIndicator />
            </View>
          )}
      <View className="flex-row items-center justify-between p-3">
        <Text className="text-xs text-neutral-500">
          {format(new Date(photo.submitted_at), 'MMM d, h:mm a')}
        </Text>
      </View>
      {photo.note && (
        <Text className="px-3 pb-3 text-xs text-neutral-500">{photo.note}</Text>
      )}
    </View>
  );
}

export function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['admin-campaign-detail', id],
    queryFn: () => fetchCampaignDetail(id!),
    enabled: !!id,
  });

  if (isLoading || !campaign) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <AdminHeader title={campaign.title} right={<AdminSettingsGearButton />} />
      <FlatList
        data={campaign.campaign_photos}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={<CampaignInfoHeader campaign={campaign} />}
        renderItem={({ item }) => <PhotoCard photo={item} />}
        ListEmptyComponent={(
          <View className="items-center py-8">
            <Text className="text-sm text-neutral-500">No photos uploaded</Text>
          </View>
        )}
      />
    </View>
  );
}
