import type { ClientCampaignRow, ClientPhotoRow } from '@/lib/api/client/campaigns';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/app-logo';
import { SpinnerAnimation, TruckAnimation } from '@/components/motion';
import { Text, View } from '@/components/ui';
import { Camera, CaretDown, Clock, LogOut } from '@/components/ui/icons';
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

// ─── Photo thumbnail ──────────────────────────────────────────────

function PhotoThumb({ storagePath }: { storagePath: string | null }) {
  const { data: uri } = useQuery({
    queryKey: ['client-photo-thumb', storagePath],
    queryFn: () => getClientPhotoSignedUrl(storagePath!),
    enabled: !!storagePath,
    staleTime: 50 * 60 * 1000,
  });

  if (!uri) {
    return <View className="size-20 rounded-xl bg-neutral-100 dark:bg-neutral-700" />;
  }
  return (
    <ExpoImage
      source={{ uri }}
      style={{ width: 80, height: 80, borderRadius: 12 }}
      contentFit="cover"
    />
  );
}

// ─── Campaign card ────────────────────────────────────────────────

function CampaignCard({ campaign, index }: { campaign: ClientCampaignRow; index: number }) {
  const [expanded, setExpanded] = React.useState(false);

  const photosQ = useQuery<ClientPhotoRow[]>({
    queryKey: ['client-campaign-photos', campaign.id],
    queryFn: () => fetchClientCampaignPhotos(campaign.id),
    enabled: expanded,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motionTokens.duration.base, delay: index * 60 }}
      className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
    >
      {/* Header row */}
      <TouchableOpacity
        onPress={() => setExpanded(o => !o)}
        activeOpacity={0.8}
        className="flex-row items-center justify-between p-4"
      >
        <View className="flex-1 gap-1 pr-3">
          <Text className="text-sm font-semibold" numberOfLines={1}>{campaign.title}</Text>
          <Text className="text-xs text-neutral-500">
            {format(new Date(`${campaign.campaign_date}T12:00:00`), 'MMM d, yyyy')}
            {campaign.photo_count > 0 ? ` · ${campaign.photo_count} photo${campaign.photo_count !== 1 ? 's' : ''}` : ''}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <StatusBadge status={campaign.status} />
          <MotiView
            animate={{ rotate: expanded ? '180deg' : '0deg' }}
            transition={{ type: 'timing', duration: motionTokens.duration.fast }}
          >
            <CaretDown color="#737373" width={16} height={16} />
          </MotiView>
        </View>
      </TouchableOpacity>

      {/* Expandable photo grid */}
      {expanded && (
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motionTokens.duration.fast }}
          className="border-t border-neutral-100 p-4 dark:border-neutral-700"
        >
          {photosQ.isLoading && (
            <View className="items-center py-4">
              <SpinnerAnimation size={40} />
            </View>
          )}
          {!photosQ.isLoading && (photosQ.data?.length ?? 0) === 0 && (
            <Text className="py-4 text-center text-xs text-neutral-400">No photos yet</Text>
          )}
          {(photosQ.data?.length ?? 0) > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {photosQ.data!.map((photo, i) => (
                <MotiView
                  key={photo.id}
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'timing', duration: motionTokens.duration.fast, delay: i * 40 }}
                >
                  <PhotoThumb storagePath={photo.storage_path} />
                </MotiView>
              ))}
            </View>
          )}
        </MotiView>
      )}
    </MotiView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────

export function ClientLandingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useAuthStore.use.profile();
  const signOut = useAuthStore.use.signOut();

  const { data: campaigns, isLoading, isError } = useQuery<ClientCampaignRow[]>({
    queryKey: ['client-campaigns', profile?.client_id],
    queryFn: () => fetchClientCampaigns(profile!.client_id!),
    enabled: !!profile?.client_id,
  });

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: motionTokens.duration.base }}
        className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pb-3 dark:border-neutral-700 dark:bg-neutral-800"
        style={{ paddingTop: insets.top + 8 }}
      >
        <AppLogo size="sm" showText />
        <View className="flex-row items-center gap-1">
          <TouchableOpacity
            onPress={() => router.push('/(app)/client/timing')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="mr-1 size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
            accessibilityLabel="Timing sheet"
          >
            <Clock color="#737373" width={18} height={18} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={signOut}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
          >
            <LogOut color="#737373" width={18} height={18} />
          </TouchableOpacity>
        </View>
      </MotiView>

      {/* Loading */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <SpinnerAnimation size={64} />
        </View>
      )}

      {/* Error */}
      {isError && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-neutral-500">
            Couldn't load campaigns. Please try again.
          </Text>
        </View>
      )}

      {/* Empty */}
      {!isLoading && !isError && (campaigns?.length ?? 0) === 0 && (
        <View className="flex-1 items-center justify-center p-6">
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={motionTokens.spring.gentle}
            className="w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <TruckAnimation size={160} />
            <Text className="text-center text-sm text-neutral-500">
              No campaigns assigned to your account yet.
            </Text>
          </MotiView>
        </View>
      )}

      {/* Campaign list */}
      {!isLoading && !isError && (campaigns?.length ?? 0) > 0 && (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: motionTokens.duration.base }}
            className="mb-1 flex-row items-center gap-1.5"
          >
            <Camera color="#737373" width={14} height={14} />
            <Text className="text-xs font-medium text-neutral-500">
              {`${campaigns!.length} campaign${campaigns!.length !== 1 ? 's' : ''}`}
            </Text>
          </MotiView>
          {campaigns!.map((c, i) => (
            <CampaignCard key={c.id} campaign={c} index={i} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
