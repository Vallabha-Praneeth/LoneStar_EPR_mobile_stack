import type { CampaignDetail } from '@/lib/api/admin/campaigns';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, FlatList, Image } from 'react-native';

import { AdminHeader } from '@/components/admin-header';
import { InfoCard } from '@/components/info-card';
import { StatusBadge } from '@/components/status-badge';
import { Text, View } from '@/components/ui';
import { fetchCampaignDetail } from '@/lib/api/admin/campaigns';
import { getSignedUrl } from '@/lib/api/admin/photos';

function CampaignInfoHeader({ campaign }: { campaign: CampaignDetail }) {
  const totalCost
    = (campaign.driver_daily_wage ?? 0)
      + (campaign.transport_cost ?? 0)
      + (campaign.other_cost ?? 0);

  return (
    <View className="mb-2 gap-4">
      <View className="flex-row items-center gap-2">
        <StatusBadge status={campaign.status} />
        <Text className="text-sm text-gray-500">
          {format(new Date(campaign.campaign_date), 'MMM d, yyyy')}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <InfoCard icon="👤" label="Client" value={campaign.clients?.name ?? 'No client'} />
        </View>
        <View className="flex-1">
          <InfoCard icon="🚛" label="Driver" value={campaign.driver_profile?.display_name ?? 'Unassigned'} />
        </View>
      </View>

      {campaign.route_code && (
        <InfoCard icon="📍" label="Route" value={campaign.route_code} />
      )}

      <View className="flex-row gap-3">
        <View className="flex-1">
          <InfoCard icon="💰" label="Driver Wage" value={`$${campaign.driver_daily_wage ?? 0}`} />
        </View>
        <View className="flex-1">
          <InfoCard icon="🚚" label="Transport" value={`$${campaign.transport_cost ?? 0}`} />
        </View>
      </View>

      {(campaign.other_cost ?? 0) > 0 && (
        <InfoCard icon="📋" label="Other Cost" value={`$${campaign.other_cost}`} />
      )}

      <InfoCard icon="💵" label="Total Cost" value={`$${totalCost}`} />

      {campaign.internal_notes && (
        <View className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <Text className="mb-1 text-xs text-gray-500">Notes</Text>
          <Text className="text-sm">{campaign.internal_notes}</Text>
        </View>
      )}

      {campaign.driver_shifts.length > 0 && (
        <View className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <Text className="mb-2 text-xs text-gray-500">Shifts</Text>
          {campaign.driver_shifts.map(shift => (
            <View key={shift.id} className="mb-1 flex-row items-center gap-2">
              <Text className="text-sm">
                {format(new Date(shift.started_at), 'h:mm a')}
              </Text>
              <Text className="text-xs text-gray-400">→</Text>
              <Text className="text-sm">
                {shift.ended_at
                  ? format(new Date(shift.ended_at), 'h:mm a')
                  : 'In progress'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text className="mt-2 text-sm font-semibold">
        Photos (
        {campaign.campaign_photos.length}
        )
      </Text>
    </View>
  );
}

function PhotoCard({
  photo,
}: {
  photo: { id: string; status: string; submitted_at: string; note: string | null; storage_path: string };
}) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    getSignedUrl(photo.storage_path).then(setUrl).catch(() => {});
  }, [photo.storage_path]);

  return (
    <View className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {url
        ? (
            <Image source={{ uri: url }} className="h-48 w-full" resizeMode="cover" />
          )
        : (
            <View className="h-48 w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
              <ActivityIndicator />
            </View>
          )}
      <View className="flex-row items-center justify-between p-3">
        <Text className="text-xs text-gray-500">
          {format(new Date(photo.submitted_at), 'MMM d, h:mm a')}
        </Text>
        <StatusBadge status={photo.status} />
      </View>
      {photo.note && (
        <Text className="px-3 pb-3 text-xs text-gray-500">{photo.note}</Text>
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
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <AdminHeader title={campaign.title} />
      <FlatList
        data={campaign.campaign_photos}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={<CampaignInfoHeader campaign={campaign} />}
        renderItem={({ item }) => <PhotoCard photo={item} />}
        ListEmptyComponent={(
          <View className="items-center py-8">
            <Text className="text-sm text-gray-500">No photos uploaded</Text>
          </View>
        )}
      />
    </View>
  );
}
