import type { ClientCampaignRow, ClientPhotoRow } from '@/lib/api/client/campaigns';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpinnerAnimation } from '@/components/motion';
import { Text, View } from '@/components/ui';
import { ChevronLeft } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';
import {
  fetchClientCampaignPhotos,
  fetchClientCampaigns,
  getClientPhotoSignedUrl,
} from '@/lib/api/client/campaigns';
import { motionTokens } from '@/lib/motion/tokens';

// ─── Status badge ─────────────────────────────────────────────────

const STATUS_STYLES: Record<ClientCampaignRow['status'], string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-neutral-100 text-neutral-600',
  pending: 'bg-blue-100 text-blue-700',
  draft: 'bg-amber-100 text-amber-700',
};

function StatusBadge({ status }: { status: ClientCampaignRow['status'] }) {
  return (
    <View className={`rounded-full px-2.5 py-1 ${STATUS_STYLES[status]}`}>
      <Text className="text-xs font-medium capitalize">{status}</Text>
    </View>
  );
}

// ─── Photo card ────────────────────────────────────────────────────

function PhotoCard({ photo, index }: { photo: ClientPhotoRow; index: number }) {
  const { data: uri } = useQuery({
    queryKey: ['client-photo-thumb', photo.storage_path],
    queryFn: () => getClientPhotoSignedUrl(photo.storage_path!),
    enabled: !!photo.storage_path,
    staleTime: 50 * 60 * 1000,
  });

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: motionTokens.duration.base, delay: index * 50 }}
      className="overflow-hidden rounded-2xl"
      style={{ width: '48%', aspectRatio: 1 }}
    >
      {uri
        ? (
            <ExpoImage
              source={{ uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          )
        : (
            <View className="size-full items-center justify-center bg-neutral-100 dark:bg-neutral-700" />
          )}
    </MotiView>
  );
}

// ─── Screen ───────────────────────────────────────────────────────

export default function CampaignPhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore.use.profile();

  // Pull campaign metadata from the already-cached campaign list query
  const { data: campaigns } = useQuery<ClientCampaignRow[]>({
    queryKey: ['client-campaigns', profile?.client_id],
    queryFn: () => fetchClientCampaigns(profile!.client_id!),
    enabled: !!profile?.client_id,
  });
  const campaign = campaigns?.find(c => c.id === id);

  const photosQ = useQuery<ClientPhotoRow[]>({
    queryKey: ['client-campaign-photos', id],
    queryFn: () => fetchClientCampaignPhotos(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: motionTokens.duration.base }}
        className="border-b border-neutral-200 bg-white px-4 pb-3 dark:border-neutral-700 dark:bg-neutral-800"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
            accessibilityLabel="Go back"
          >
            <ChevronLeft color="#737373" width={18} height={18} />
          </TouchableOpacity>
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-semibold" numberOfLines={1}>
              {campaign?.title ?? 'Campaign'}
            </Text>
            {campaign && (
              <Text className="text-xs text-neutral-500">
                {format(new Date(`${campaign.campaign_date}T12:00:00`), 'MMM d, yyyy')}
              </Text>
            )}
          </View>
          {campaign && <StatusBadge status={campaign.status} />}
        </View>
      </MotiView>

      {/* Loading */}
      {photosQ.isLoading && (
        <View className="flex-1 items-center justify-center">
          <SpinnerAnimation size={64} />
        </View>
      )}

      {/* Empty */}
      {!photosQ.isLoading && (photosQ.data?.length ?? 0) === 0 && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-neutral-400">No photos yet for this campaign.</Text>
        </View>
      )}

      {/* Photo grid */}
      {(photosQ.data?.length ?? 0) > 0 && (
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            gap: 12,
            paddingBottom: insets.bottom + 16,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
          showsVerticalScrollIndicator={false}
        >
          {photosQ.data!.map((photo, i) => (
            <PhotoCard key={photo.id} photo={photo} index={i} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
