import type { ClientCampaignRow, ClientPhotoRow } from '@/lib/api/client/campaigns';
import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CampaignStageProgress } from '@/components/campaign-stage-progress';
import { DriverTransitBadge } from '@/components/driver-transit-badge';
import { SpinnerAnimation } from '@/components/motion';
import { StatusBadge } from '@/components/status-badge';
import { Text, View } from '@/components/ui';
import { ChevronLeft } from '@/components/ui/icons';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/features/auth/use-auth-store';
import {
  fetchClientCampaignPhotos,
  fetchClientCampaigns,
  getClientPhotoSignedUrl,
} from '@/lib/api/client/campaigns';
import { motionTokens } from '@/lib/motion/tokens';
import { useDriverPositionSubscriberSnapshot } from '@/lib/realtime/driver-location';
import { useSmoothedLiveCoord } from '@/lib/realtime/live-map-motion';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const clientMapStyles = StyleSheet.create({
  map: { height: 150, borderRadius: 12, overflow: 'hidden' },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#3b82f6', borderWidth: 2, borderColor: '#fff' },
});

function LiveDriverBanner({ shiftId }: { shiftId: string }) {
  const snapshot = useDriverPositionSubscriberSnapshot(shiftId);
  const coord = useSmoothedLiveCoord(snapshot);
  const [now, setNow] = React.useState(Date.now);
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  const isStale = snapshot != null && now - snapshot.ts > 60_000;
  return (
    <View className="gap-2 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
      <DriverTransitBadge />
      {coord != null
        ? (
            <>
              <Map
                style={clientMapStyles.map}
                mapStyle={MAP_STYLE}
                logo={false}
                attribution={false}
                dragPan={false}
                touchZoom={false}
                doubleTapZoom={false}
              >
                <Camera center={coord} zoom={14} duration={300} />
                <Marker id="client-driver" lngLat={coord}>
                  <View style={clientMapStyles.dot} />
                </Marker>
              </Map>
              {isStale && (
                <Text className="text-xs text-amber-500">
                  {`Last seen ${format(new Date(snapshot!.ts), 'h:mm a')}`}
                </Text>
              )}
            </>
          )
        : (
            <Text className="text-xs text-neutral-400">Tracking driver location…</Text>
          )}
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
          <ThemeToggle />
          {campaign && <StatusBadge status={campaign.status} />}
        </View>
      </MotiView>

      {/* Stage progress */}
      {campaign && (
        <View className="border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
          <CampaignStageProgress status={campaign.status} />
        </View>
      )}

      {/* Live driver position */}
      {campaign?.hasActiveShift && campaign.activeShiftId && (
        <LiveDriverBanner shiftId={campaign.activeShiftId} />
      )}

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
