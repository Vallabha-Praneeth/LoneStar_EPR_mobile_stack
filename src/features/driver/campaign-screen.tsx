import type { DriverCampaignData, PastCampaignRow, RouteStop } from '@/lib/api/driver/campaign';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Image as ExpoImage } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { AppLogo } from '@/components/app-logo';
import { CampaignMilestoneAnimation, CampaignProgressAnimation, SpinnerAnimation, TruckAnimation } from '@/components/motion';
import { StatusBadge } from '@/components/status-badge';
import { Text, View } from '@/components/ui';
import { Camera, CaretDown, Clock, LogOut, Play, StopCircle } from '@/components/ui/icons';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { DriverLaunchSplash } from '@/features/driver/components/driver-launch-splash';
import { StopTransitOverlay } from '@/features/driver/components/stop-transit-overlay';
import {
  endShift,
  fetchDriverCampaign,
  fetchDriverPastCampaigns,
  getPhotoSignedUrl,
  startShift,
} from '@/lib/api/driver/campaign';
import { completeStop } from '@/lib/api/driver/photos';
import { motionTokens } from '@/lib/motion/tokens';
import { useDriverPositionPublisher } from '@/lib/realtime/driver-location';

MapLibreGL.setAccessToken(null);

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

type CampaignPhoto = DriverCampaignData['campaign_photos'][number];

function PhotoThumbnail({ storagePath }: { storagePath: string | null }) {
  const { data: uri } = useQuery({
    queryKey: ['photo-thumb', storagePath],
    queryFn: () => getPhotoSignedUrl(storagePath!),
    enabled: !!storagePath,
    staleTime: 50 * 60 * 1000,
  });
  if (!uri)
    return <View className="size-10 rounded-lg bg-neutral-100 dark:bg-neutral-700" />;
  return <ExpoImage source={{ uri }} style={{ width: 40, height: 40, borderRadius: 8 }} contentFit="cover" />;
}

function CampaignHeader({ right }: { right: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motionTokens.duration.base }}
      className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pt-14 pb-3 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <AppLogo size="sm" showText />
      {right}
    </MotiView>
  );
}

function EmptyCampaignState({ onSignOut }: { onSignOut: () => void }) {
  return (
    <View testID="driver-campaign-screen" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <CampaignHeader
        right={(
          <View className="flex-row items-center gap-2">
            <ThemeToggle />
            <TouchableOpacity
              onPress={onSignOut}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
            >
              <LogOut color="#737373" width={18} height={18} />
            </TouchableOpacity>
          </View>
        )}
      />
      <View className="flex-1 items-center justify-center p-6">
        <MotiView
          from={{ opacity: 0, scale: 0.9, translateY: 16 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={motionTokens.spring.gentle}
          className="w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-neutral-800"
        >
          <TruckAnimation size={380} />
          <Text className="text-center text-sm font-medium text-neutral-500">
            No active campaign assigned to you today.
          </Text>
        </MotiView>
      </View>
    </View>
  );
}

function ShiftStatusBadge({ startedAt }: { startedAt: string }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={motionTokens.spring.lively}
      className="flex-row items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 dark:bg-green-900/30"
    >
      {/* pulsing live dot */}
      <View className="size-4 items-center justify-center">
        <MotiView
          from={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ type: 'timing', duration: 1100, loop: true }}
          className="absolute size-2 rounded-full bg-green-500"
        />
        <View className="size-2 rounded-full bg-green-500" />
      </View>
      <Clock color="#16a34a" width={14} height={14} />
      <Text className="text-sm font-medium text-green-700 dark:text-green-400">
        Shift started at
        {' '}
        {format(new Date(startedAt), 'h:mm a')}
      </Text>
    </MotiView>
  );
}

type ShiftActionsProps = {
  activeShift: boolean;
  onStartShift: () => void;
  isStartPending: boolean;
  onEndShift: () => void;
  isEndPending: boolean;
  onUploadPhoto: () => void;
};

function ShiftActions({
  activeShift,
  onStartShift,
  isStartPending,
  onEndShift,
  isEndPending,
  onUploadPhoto,
}: ShiftActionsProps) {
  if (!activeShift) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ ...motionTokens.spring.lively, delay: 120 }}
      >
        <TouchableOpacity
          testID="start-shift-button"
          onPress={onStartShift}
          disabled={isStartPending}
          activeOpacity={0.8}
          className="h-14 items-center justify-center rounded-xl bg-green-600 disabled:opacity-50"
        >
          <View className="flex-row items-center gap-2">
            {isStartPending
              ? <ActivityIndicator color="white" />
              : (
                  <>
                    <MotiView
                      from={{ rotate: '0deg' }}
                      animate={{ rotate: '0deg' }}
                      transition={{ type: 'timing', duration: motionTokens.duration.fast }}
                    >
                      <Play color="#fff" width={18} height={18} />
                    </MotiView>
                    <Text className="text-base font-semibold text-white">Start Shift</Text>
                  </>
                )}
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  }
  return (
    <>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ ...motionTokens.spring.lively, delay: 60 }}
      >
        <TouchableOpacity
          testID="upload-photo-button"
          onPress={onUploadPhoto}
          activeOpacity={0.8}
          className="h-14 items-center justify-center rounded-xl bg-primary"
        >
          <View className="flex-row items-center gap-2">
            <MotiView
              from={{ scale: 1 }}
              animate={{ scale: 1.15 }}
              transition={{ type: 'timing', duration: 800, loop: true, repeatReverse: true }}
            >
              <Camera color="#fff" width={18} height={18} />
            </MotiView>
            <Text className="text-base font-semibold text-white">Upload Photo</Text>
          </View>
        </TouchableOpacity>
      </MotiView>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ ...motionTokens.spring.lively, delay: 140 }}
      >
        <TouchableOpacity
          testID="end-shift-button"
          onPress={onEndShift}
          disabled={isEndPending}
          activeOpacity={0.8}
          className="h-14 items-center justify-center rounded-xl border border-red-200 bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20"
        >
          <View className="flex-row items-center gap-2">
            {isEndPending
              ? <ActivityIndicator color="#ef4444" />
              : (
                  <>
                    <StopCircle color="#ef4444" width={18} height={18} />
                    <Text className="text-base font-semibold text-red-500">End Shift</Text>
                  </>
                )}
          </View>
        </TouchableOpacity>
      </MotiView>
    </>
  );
}

function RecentUploadsList({ photos }: { photos: CampaignPhoto[] }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 200 }}
      className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <Text className="mb-3 font-semibold">Recent Uploads</Text>
      {photos.map((photo, i) => (
        <MotiView
          key={photo.id}
          from={{ opacity: 0, translateX: -12 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: motionTokens.duration.base, delay: i * 60 }}
          className={`flex-row items-center justify-between py-2 ${
            i < photos.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''
          }`}
        >
          <View className="flex-row items-center gap-3">
            <PhotoThumbnail storagePath={photo.storage_path} />
            <Text className="text-sm text-neutral-500">
              {format(new Date(photo.submitted_at), 'h:mm a')}
            </Text>
          </View>
          <View className="rounded-full bg-green-100 px-2 py-1 dark:bg-green-900/40">
            <Text className="text-xs font-medium text-green-700 dark:text-green-300">
              Uploaded
            </Text>
          </View>
        </MotiView>
      ))}
    </MotiView>
  );
}

function PastCampaignsAccordion({ driverId }: { driverId: string }) {
  const [open, setOpen] = React.useState(false);
  const { data: past = [], isLoading } = useQuery<PastCampaignRow[]>({
    queryKey: ['driver-past-campaigns', driverId],
    queryFn: () => fetchDriverPastCampaigns(driverId),
    enabled: open,
  });

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 280 }}
      className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
    >
      <TouchableOpacity
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.8}
        className="flex-row items-center justify-between p-5"
      >
        <Text className="font-semibold">Past Campaigns</Text>
        <MotiView
          animate={{ rotate: open ? '180deg' : '0deg' }}
          transition={{ type: 'timing', duration: motionTokens.duration.fast }}
        >
          <CaretDown color="#737373" width={18} height={18} />
        </MotiView>
      </TouchableOpacity>
      {open && (
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motionTokens.duration.fast }}
          className="border-t border-neutral-100 dark:border-neutral-700"
        >
          {isLoading && (
            <View className="items-center py-6">
              <ActivityIndicator />
            </View>
          )}
          {!isLoading && past.length === 0 && (
            <Text className="p-5 text-center text-sm text-neutral-500">No past campaigns.</Text>
          )}
          {past.map((c, i) => (
            <MotiView
              key={c.id}
              from={{ opacity: 0, translateX: -8 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: motionTokens.duration.fast, delay: i * 50 }}
              className={`flex-row items-center justify-between px-5 py-3 ${
                i < past.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''
              }`}
            >
              <View>
                <Text className="text-sm font-medium">{c.title}</Text>
                <Text className="text-xs text-neutral-500">
                  {format(new Date(`${c.campaign_date}T12:00:00`), 'MMM d, yyyy')}
                </Text>
              </View>
              <View className="rounded-full bg-neutral-100 px-2 py-1 dark:bg-neutral-700">
                <Text className="text-xs font-medium text-neutral-600 capitalize dark:text-neutral-400">
                  {c.status}
                </Text>
              </View>
            </MotiView>
          ))}
        </MotiView>
      )}
    </MotiView>
  );
}

// ─── Route map ───────────────────────────────────────────────────

const mapStyles = StyleSheet.create({
  map: { height: 200 },
  markerDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  driverDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

function RouteMapCard({
  stops,
  driverCoord,
}: {
  stops: RouteStop[];
  driverCoord: [number, number] | null;
}) {
  const stopsWithCoords = stops.filter(
    s => s.latitude != null && s.longitude != null,
  );

  if (stopsWithCoords.length < 2)
    return null;

  const sumLat = stopsWithCoords.reduce((acc, s) => acc + s.latitude!, 0);
  const sumLng = stopsWithCoords.reduce((acc, s) => acc + s.longitude!, 0);
  const centerLat = sumLat / stopsWithCoords.length;
  const centerLng = sumLng / stopsWithCoords.length;

  const lineCoords = stopsWithCoords.map(s => [s.longitude!, s.latitude!]);
  const lineGeoJson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: lineCoords },
  };

  return (
    <>
      <Text className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
        Route Map
      </Text>
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 180 }}
        style={{ borderRadius: 16, overflow: 'hidden' }}
      >
        <MapLibreGL.MapView
          style={mapStyles.map}
          mapStyle={MAP_STYLE_URL}
          logoEnabled={false}
          attributionEnabled={false}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <MapLibreGL.Camera
            centerCoordinate={[centerLng, centerLat]}
            zoomLevel={12}
          />
          <MapLibreGL.ShapeSource id="route-line-source" shape={lineGeoJson}>
            <MapLibreGL.LineLayer
              id="route-line"
              style={{ lineColor: '#3b82f6', lineWidth: 2, lineDasharray: [4, 2] }}
            />
          </MapLibreGL.ShapeSource>
          {stopsWithCoords.map((stop, i) => (
            <MapLibreGL.PointAnnotation
              key={stop.id}
              id={`stop-${i}`}
              coordinate={[stop.longitude!, stop.latitude!]}
            >
              <View style={mapStyles.markerDot}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                  {i + 1}
                </Text>
              </View>
            </MapLibreGL.PointAnnotation>
          ))}
          {driverCoord != null
            ? (
                <MapLibreGL.PointAnnotation id="driver-pos" coordinate={driverCoord}>
                  <MotiView
                    from={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ type: 'timing', duration: 1100, loop: true }}
                    style={[mapStyles.driverDot, { position: 'absolute' }]}
                  />
                  <View style={mapStyles.driverDot} />
                </MapLibreGL.PointAnnotation>
              )
            : null}
        </MapLibreGL.MapView>
      </MotiView>
    </>
  );
}

// ─── Route stops ─────────────────────────────────────────────────

type StopState = { stop: RouteStop; done: boolean; skipped: boolean };

function StopRow({
  item,
  index,
  total,
  onDone,
  onSkip,
  onMove,
  onPhoto,
}: {
  item: StopState;
  index: number;
  total: number;
  onDone: () => void;
  onSkip: () => void;
  onMove: (dir: 'up' | 'down') => void;
  onPhoto: () => void;
}) {
  const { stop, done, skipped } = item;
  return (
    <MotiView
      from={{ opacity: 0, translateX: -8 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: motionTokens.duration.fast, delay: index * 40 }}
      className={`flex-row items-center gap-2 py-2 ${index < total - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''}`}
    >
      {/* Move buttons */}
      <View className="gap-0.5">
        <TouchableOpacity
          disabled={index === 0 || done || skipped}
          onPress={() => onMove('up')}
          className="rounded-sm bg-neutral-100 px-1.5 py-0.5 disabled:opacity-30 dark:bg-neutral-700"
        >
          <Text className="text-xs">↑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={index === total - 1 || done || skipped}
          onPress={() => onMove('down')}
          className="rounded-sm bg-neutral-100 px-1.5 py-0.5 disabled:opacity-30 dark:bg-neutral-700"
        >
          <Text className="text-xs">↓</Text>
        </TouchableOpacity>
      </View>

      {/* Stop info */}
      <View className="flex-1">
        <Text
          className={`text-sm font-medium ${done || skipped ? 'text-neutral-400 line-through' : ''}`}
          numberOfLines={1}
        >
          {stop.venue_name}
        </Text>
        {stop.address
          ? <Text className="text-xs text-neutral-500" numberOfLines={1}>{stop.address}</Text>
          : null}
      </View>

      {/* Actions */}
      {!done && !skipped
        ? (
            <>
              <TouchableOpacity
                onPress={onPhoto}
                className="rounded-lg bg-primary/10 p-1.5"
                accessibilityLabel="Upload photo for this stop"
              >
                <Camera color="#1d4ed8" width={14} height={14} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onDone}
                className="rounded-lg bg-green-100 px-2.5 py-1 dark:bg-green-900/40"
              >
                <Text className="text-xs font-semibold text-green-700 dark:text-green-400">Done</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSkip}
                className="rounded-lg bg-neutral-100 px-2.5 py-1 dark:bg-neutral-700"
              >
                <Text className="text-xs font-medium text-neutral-500">Skip</Text>
              </TouchableOpacity>
            </>
          )
        : (
            <View className={`rounded-full px-2 py-0.5 ${done ? 'bg-green-100 dark:bg-green-900/40' : 'bg-neutral-100 dark:bg-neutral-700'}`}>
              <Text className={`text-xs font-medium ${done ? 'text-green-700 dark:text-green-400' : 'text-neutral-400'}`}>
                {done ? '✓' : 'Skipped'}
              </Text>
            </View>
          )}
    </MotiView>
  );
}

function RouteStopsCard({
  stops,
  shiftId,
}: {
  stops: RouteStop[];
  shiftId: string | undefined;
}) {
  const router = useRouter();
  const [items, setItems] = React.useState<StopState[]>(
    () => stops.map(s => ({ stop: s, done: false, skipped: false })),
  );

  const doneCount = items.filter(i => i.done).length;
  const activeCount = items.filter(i => !i.skipped).length;
  const allDone = activeCount > 0 && items.filter(i => !i.skipped).every(i => i.done);

  const [transitTo, setTransitTo] = React.useState<RouteStop | null>(null);
  const handleTransitDismiss = React.useCallback(() => setTransitTo(null), []);

  function markDone(idx: number) {
    const item = items[idx];
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, done: true } : it)));
    // find next active stop
    const nextStop = items.slice(idx + 1).find(it => !it.done && !it.skipped);
    setTransitTo(nextStop?.stop ?? null);
    if (shiftId && item) {
      completeStop(shiftId, item.stop.id).catch(() => {
        showMessage({ message: 'Stop synced locally — will retry on reconnect', type: 'warning' });
      });
    }
  }

  function markSkip(idx: number) {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, skipped: true } : it)));
  }

  function moveStop(index: number, dir: 'up' | 'down') {
    setItems((prev) => {
      const arr = [...prev];
      const t = dir === 'up' ? index - 1 : index + 1;
      if (t < 0 || t >= arr.length)
        return prev;
      [arr[index], arr[t]] = [arr[t], arr[index]];
      return arr;
    });
  }

  function openUploadForStop(stop: RouteStop) {
    router.push({
      pathname: '/(app)/upload',
      params: { stopId: stop.id, stopName: stop.venue_name },
    });
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 240 }}
      className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"
    >
      {/* Header + progress bar */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-semibold">Route Stops</Text>
        <Text className="text-xs text-neutral-500">
          {`${doneCount} / ${activeCount} done`}
        </Text>
      </View>

      <View className="mb-3 items-center">
        <CampaignProgressAnimation width={220} height={48} />
      </View>

      {allDone && (
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={motionTokens.spring.lively}
          className="mb-3 items-center"
        >
          <CampaignMilestoneAnimation size={80} />
          <Text className="mt-1 text-center text-sm font-semibold text-green-600 dark:text-green-400">
            All stops complete!
          </Text>
        </MotiView>
      )}

      {items.map((item, i) => (
        <StopRow
          key={item.stop.id}
          item={item}
          index={i}
          total={items.length}
          onDone={() => markDone(i)}
          onSkip={() => markSkip(i)}
          onMove={dir => moveStop(i, dir)}
          onPhoto={() => openUploadForStop(item.stop)}
        />
      ))}
      <StopTransitOverlay
        visible={transitTo !== null}
        nextStopName={transitTo?.venue_name ?? null}
        onDismiss={handleTransitDismiss}
      />
    </MotiView>
  );
}

function useShiftMutations(campaign: Awaited<ReturnType<typeof fetchDriverCampaign>>) {
  const signOut = useAuthStore.use.signOut();
  const queryClient = useQueryClient();
  const profileId = useAuthStore.use.profile()?.id;

  const startMutation = useMutation({
    mutationFn: () => startShift(campaign!.id, profileId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-campaign'] });
      showMessage({ message: 'Shift started', type: 'success' });
    },
    onError: (err: Error) => showMessage({ message: err.message, type: 'danger' }),
  });

  const endMutation = useMutation({
    mutationFn: () => {
      const active = campaign!.driver_shifts.find(s => !s.ended_at);
      return endShift(active!.id);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['driver-campaign'] });
      showMessage({ message: 'Shift ended. Good work!', type: 'success' });
      await signOut();
    },
    onError: (err: Error) => showMessage({ message: err.message, type: 'danger' }),
  });

  return { startMutation, endMutation };
}

type ActiveCampaignProps = {
  campaign: DriverCampaignData;
  activeShift: DriverCampaignData['driver_shifts'][number] | undefined;
  driverCoord: [number, number] | null;
  signOut: () => void;
  onStartShift: () => void;
  isStartPending: boolean;
  onEndShift: () => void;
  isEndPending: boolean;
  recentPhotos: CampaignPhoto[];
  profileId: string | undefined;
};

function ActiveCampaignView({
  campaign,
  activeShift,
  driverCoord,
  signOut,
  onStartShift,
  isStartPending,
  onEndShift,
  isEndPending,
  recentPhotos,
  profileId,
}: ActiveCampaignProps) {
  const router = useRouter();
  return (
    <View testID="driver-campaign-screen" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <CampaignHeader
        right={(
          <View className="flex-row items-center gap-2">
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={motionTokens.spring.lively}
            >
              <StatusBadge status={activeShift ? 'active' : campaign.status} />
            </MotiView>
            <ThemeToggle />
            <TouchableOpacity
              onPress={signOut}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
            >
              <LogOut color="#737373" width={18} height={18} />
            </TouchableOpacity>
          </View>
        )}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...motionTokens.spring.gentle, delay: 60 }}
          className="gap-4 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"
        >
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 100 }}
          >
            <Text className="text-lg font-semibold">{campaign.title}</Text>
            <Text className="mt-1 text-sm text-neutral-500">
              {format(new Date(`${campaign.campaign_date}T12:00:00`), 'MMMM d, yyyy')}
              {campaign.routes?.name ? ` • Route ${campaign.routes.name}` : ''}
            </Text>
          </MotiView>
          {activeShift ? <ShiftStatusBadge startedAt={activeShift.started_at} /> : null}
          <View className="gap-3">
            <ShiftActions
              activeShift={!!activeShift}
              onStartShift={onStartShift}
              isStartPending={isStartPending}
              onEndShift={onEndShift}
              isEndPending={isEndPending}
              onUploadPhoto={() => router.push('/(app)/upload')}
            />
          </View>
        </MotiView>
        {activeShift && campaign.routes?.route_stops && campaign.routes.route_stops.length >= 2
          ? (
              <RouteMapCard
                stops={campaign.routes.route_stops}
                driverCoord={driverCoord}
              />
            )
          : null}
        {campaign.routes?.route_stops && campaign.routes.route_stops.length > 0
          ? <RouteStopsCard stops={campaign.routes.route_stops} shiftId={activeShift?.id} />
          : null}
        {recentPhotos.length > 0 ? <RecentUploadsList photos={recentPhotos} /> : null}
        {profileId ? <PastCampaignsAccordion driverId={profileId} /> : null}
      </ScrollView>
    </View>
  );
}

export function CampaignScreen() {
  const profile = useAuthStore.use.profile();
  const signOut = useAuthStore.use.signOut();
  const [showSplash, setShowSplash] = React.useState(true);
  const handleSplashDone = React.useCallback(() => setShowSplash(false), []);
  const [driverCoord, setDriverCoord] = React.useState<[number, number] | null>(null);

  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['driver-campaign', profile?.id],
    queryFn: () => fetchDriverCampaign(profile!.id),
    enabled: !!profile?.id,
  });

  const { startMutation, endMutation } = useShiftMutations(campaign ?? null);

  const activeShift = campaign?.driver_shifts.find(s => !s.ended_at);

  useDriverPositionPublisher(activeShift?.id, driverCoord);

  React.useEffect(() => {
    if (!activeShift)
      return;
    let sub: Location.LocationSubscription | null = null;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
      pos => setDriverCoord([pos.coords.longitude, pos.coords.latitude]),
    ).then((s) => { sub = s; });
    return () => {
      sub?.remove();
    };
  }, [activeShift]);

  const recentPhotos = [...(campaign?.campaign_photos ?? [])]
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <SpinnerAnimation size={64} />
      </View>
    );
  }

  if (error || !campaign) {
    return <EmptyCampaignState onSignOut={signOut} />;
  }

  if (showSplash) {
    return <DriverLaunchSplash onDone={handleSplashDone} />;
  }

  return (
    <ActiveCampaignView
      campaign={campaign}
      activeShift={activeShift}
      driverCoord={driverCoord}
      signOut={signOut}
      onStartShift={() => startMutation.mutate()}
      isStartPending={startMutation.isPending}
      onEndShift={() => endMutation.mutate()}
      isEndPending={endMutation.isPending}
      recentPhotos={recentPhotos}
      profileId={profile?.id}
    />
  );
}
