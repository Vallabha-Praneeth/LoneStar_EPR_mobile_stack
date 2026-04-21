import type { DriverCampaignData, PastCampaignRow, RouteStop } from '@/lib/api/driver/campaign';
import { GeoJSONSource, Layer, Marker, Camera as MLCamera, Map as MLMap } from '@maplibre/maplibre-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Image as ExpoImage } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as React from 'react';
import { ActivityIndicator, View as RNView, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { AppLogo } from '@/components/app-logo';
import { DetachedMapModal } from '@/components/detached-map-modal';
import { ShiftStartBurst, SpinnerAnimation, TruckAnimation } from '@/components/motion';
import { StatusBadge } from '@/components/status-badge';
import { Text, View } from '@/components/ui';
import { BarChart, Camera, CaretDown, Clock, LogOut, Play, StopCircle } from '@/components/ui/icons';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useDetachedMapExpand } from '@/components/use-detached-map-expand';
import { LogoutConfirmDialog } from '@/features/auth/components/logout-confirm-dialog';
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
import {
  getLastKnownTrackingCoordForShift,
  startShiftTracking,
  stopShiftTracking,
} from '@/lib/background-location';
import { buildRouteSimulationPoints, startRouteSimulation } from '@/lib/dev/route-simulator';
import { haversineMeters } from '@/lib/geo/haversine';
import { motionTokens } from '@/lib/motion/tokens';
import { useDriverPositionPublisher } from '@/lib/realtime/driver-location';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const DEV_ROUTE_SIMULATION_ENABLED = __DEV__ && process.env.EXPO_PUBLIC_DRIVER_ROUTE_SIMULATION === '1';

/**
 * Ref-shaped guard (module scope) so it survives `CampaignScreen` remounts.
 * After a failed `endShift`, blocks `startShiftTracking` for that shift id until
 * a successful end clears it, or until there is no active shift id in data.
 */
const trackingStoppedOnErrorRef = {
  current: false,
  shiftId: null as string | null,
};
function blockTrackingForShift(shiftId: string): void {
  trackingStoppedOnErrorRef.current = true;
  trackingStoppedOnErrorRef.shiftId = shiftId;
}
function clearTrackingBlock(): void {
  trackingStoppedOnErrorRef.current = false;
  trackingStoppedOnErrorRef.shiftId = null;
}
function isTrackingBlockedFor(shiftId: string): boolean {
  return trackingStoppedOnErrorRef.current && trackingStoppedOnErrorRef.shiftId === shiftId;
}

type CampaignPhoto = DriverCampaignData['campaign_photos'][number];

function getRecentPhotos(campaign: DriverCampaignData | null | undefined): CampaignPhoto[] {
  return [...(campaign?.campaign_photos ?? [])]
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 5);
}

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

function CampaignHeaderActions({
  status,
  onAnalytics,
  onSignOut,
}: {
  status?: React.ReactNode;
  onAnalytics: () => void;
  onSignOut: () => void;
}) {
  return (
    <View className="flex-row items-center gap-2">
      {status}
      <ThemeToggle />
      <TouchableOpacity
        onPress={onAnalytics}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
        accessibilityLabel="Open analytics"
      >
        <BarChart color="#737373" width={18} height={18} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSignOut}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
      >
        <LogOut color="#737373" width={18} height={18} />
      </TouchableOpacity>
    </View>
  );
}

function EmptyCampaignState({ onSignOut }: { onSignOut: () => void }) {
  const router = useRouter();

  return (
    <View testID="driver-campaign-screen" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <CampaignHeader
        right={<CampaignHeaderActions onAnalytics={() => router.push('/(app)/driver-analytics')} onSignOut={onSignOut} />}
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
  fullMap: { flex: 1 },
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

// Tracks the "next pending stop" and flies the map camera to it when it changes.
// Uses flyTo() — the correct MapLibre beta.30 imperative camera API.
function useCameraAdvance(
  items: StopState[],
  cameraRef: React.RefObject<any>,
): [number, number] {
  const stopsWithCoords = items.filter(it => it.stop.latitude != null && it.stop.longitude != null);
  const nextStop = items.find(it => !it.done && !it.skipped && it.stop.latitude != null)?.stop ?? null;
  const nextStopId = nextStop?.id ?? null;
  const nextStopLng = nextStop?.longitude ?? null;
  const nextStopLat = nextStop?.latitude ?? null;
  // Lazy-init used once on mount — stable initial center for MLCamera center prop.
  const [initialCenter] = React.useState<[number, number]>(() => {
    if (nextStop)
      return [nextStop.longitude!, nextStop.latitude!];
    const n = Math.max(stopsWithCoords.length, 1);
    return [stopsWithCoords.reduce((s, it) => s + it.stop.longitude!, 0) / n, stopsWithCoords.reduce((s, it) => s + it.stop.latitude!, 0) / n];
  });
  const prevId = React.useRef<string | null>(nextStopId);
  React.useEffect(() => {
    if (nextStopId == null || nextStopLng == null || nextStopLat == null)
      return;
    if (nextStopId !== prevId.current) {
      prevId.current = nextStopId;
      cameraRef.current?.flyTo({ center: [nextStopLng, nextStopLat], zoom: 12, duration: 800 });
    }
  }, [nextStopId, nextStopLng, nextStopLat, cameraRef]);
  return initialCenter;
}

function RouteMapContent({
  cameraRef,
  initialCenter,
  lineGeoJson,
  stopsWithCoords,
  nearbyStopId,
  driverCoord,
  fullscreen,
}: {
  cameraRef?: React.RefObject<any>;
  initialCenter: [number, number];
  lineGeoJson: GeoJSON.Feature<GeoJSON.LineString>;
  stopsWithCoords: StopState[];
  nearbyStopId: string | null;
  driverCoord: [number, number] | null;
  fullscreen: boolean;
}) {
  return (
    <MLMap
      style={fullscreen ? mapStyles.fullMap : mapStyles.map}
      mapStyle={MAP_STYLE_URL}
      logo={false}
      attribution={false}
      dragPan={fullscreen}
      touchZoom={fullscreen}
      doubleTapZoom={fullscreen}
    >
      <MLCamera
        ref={cameraRef}
        center={initialCenter}
        zoom={12}
      />
      <GeoJSONSource id={fullscreen ? 'route-line-source-full' : 'route-line-source-card'} data={lineGeoJson}>
        <Layer
          id={fullscreen ? 'route-line-full' : 'route-line-card'}
          type="line"
          paint={{ 'line-color': '#3b82f6', 'line-width': 2, 'line-dasharray': [4, 2] }}
        />
      </GeoJSONSource>
      {stopsWithCoords.map((it, i) => {
        const { stop, done, skipped } = it;
        const isNearby = stop.id === nearbyStopId;
        const bg = done ? '#16a34a' : skipped ? '#a3a3a3' : isNearby ? '#f59e0b' : '#3b82f6';
        const label = done ? '✓' : skipped ? '×' : String(i + 1);
        return (
          <Marker key={stop.id} id={`${fullscreen ? 'full' : 'card'}-stop-${i}`} lngLat={[stop.longitude!, stop.latitude!]}>
            <View style={[mapStyles.markerDot, { backgroundColor: bg }]}>
              {isNearby && (
                <MotiView
                  from={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ type: 'timing', duration: 1100, loop: true }}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 11, backgroundColor: '#f59e0b' }]}
                />
              )}
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{label}</Text>
            </View>
          </Marker>
        );
      })}
      {driverCoord != null
        ? (
            <Marker id={fullscreen ? 'driver-pos-full' : 'driver-pos-card'} lngLat={driverCoord}>
              <View style={{ width: 16, height: 16 }}>
                <MotiView
                  from={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ type: 'timing', duration: 1100, loop: true }}
                  style={[mapStyles.driverDot, { position: 'absolute' }]}
                />
                <View style={mapStyles.driverDot} />
              </View>
            </Marker>
          )
        : null}
    </MLMap>
  );
}

function RouteMapCard({
  items,
  driverCoord,
  nearbyStopId,
}: {
  items: StopState[];
  driverCoord: [number, number] | null;
  nearbyStopId: string | null;
}) {
  const cameraRef = React.useRef<any>(null);
  const cardRef = React.useRef<RNView>(null);
  const initialCenter = useCameraAdvance(items, cameraRef);
  const stopsWithCoords = items.filter(
    it => it.stop.latitude != null && it.stop.longitude != null,
  );
  const {
    showModal,
    openMap,
    closeMap,
    expandedViewStyle,
    backdropStyle,
  } = useDetachedMapExpand(cardRef, 200);

  if (stopsWithCoords.length < 2)
    return null;

  // Line follows current (possibly reordered) sequence, not original DB order.
  const lineCoords = stopsWithCoords.map(it => [it.stop.longitude!, it.stop.latitude!]);
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
        <TouchableOpacity activeOpacity={0.9} onPress={openMap}>
          <RNView ref={cardRef} style={{ borderRadius: 16, overflow: 'hidden' }}>
            <RouteMapContent
              cameraRef={cameraRef}
              initialCenter={initialCenter}
              lineGeoJson={lineGeoJson}
              stopsWithCoords={stopsWithCoords}
              nearbyStopId={nearbyStopId}
              driverCoord={driverCoord}
              fullscreen={false}
            />
          </RNView>
        </TouchableOpacity>
      </MotiView>
      <DetachedMapModal
        visible={showModal}
        closeMap={closeMap}
        expandedViewStyle={expandedViewStyle}
        backdropStyle={backdropStyle}
      >
        <RouteMapContent
          initialCenter={initialCenter}
          lineGeoJson={lineGeoJson}
          stopsWithCoords={stopsWithCoords}
          nearbyStopId={nearbyStopId}
          driverCoord={driverCoord}
          fullscreen
        />
      </DetachedMapModal>
    </>
  );
}

// ─── Route stops ─────────────────────────────────────────────────

type StopState = { stop: RouteStop; done: boolean; skipped: boolean };

function StopRow({
  item,
  index,
  total,
  canModify,
  onDone,
  onSkip,
  onMove,
  onPhoto,
}: {
  item: StopState;
  index: number;
  total: number;
  canModify: boolean;
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
      {/* Move buttons — only shown when admin grants route modification */}
      {canModify
        ? (
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
          )
        : null}

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
              {canModify
                ? (
                    <TouchableOpacity
                      onPress={onSkip}
                      className="rounded-lg bg-neutral-100 px-2.5 py-1 dark:bg-neutral-700"
                    >
                      <Text className="text-xs font-medium text-neutral-500">Skip</Text>
                    </TouchableOpacity>
                  )
                : null}
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

// ─── Proximity nudge banner ───────────────────────────────────────
// Shown when the driver is near a pending stop. Purely informational —
// the driver can dismiss it or use it as a shortcut to mark done.
// Nothing is auto-completed; all stops remain freely actionable from the list.

function ProximityNudgeBanner({
  stopName,
  onDone,
  onDismiss,
}: {
  stopName: string;
  onDone: () => void;
  onDismiss: () => void;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 200 }}
      className="flex-row items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20"
    >
      <Text className="flex-1 text-sm font-medium text-amber-800 dark:text-amber-300" numberOfLines={1}>
        {`Near ${stopName}`}
      </Text>
      <TouchableOpacity
        onPress={onDone}
        className="rounded-lg bg-green-600 px-3 py-1.5"
        accessibilityLabel="Mark stop as done"
      >
        <Text className="text-xs font-bold text-white">Done</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text className="text-sm text-amber-600 dark:text-amber-400">✕</Text>
      </TouchableOpacity>
    </MotiView>
  );
}

function RouteStopsCard({
  items,
  canModify,
  onDone,
  onSkip,
  onMove,
}: {
  items: StopState[];
  canModify: boolean;
  onDone: (idx: number) => void;
  onSkip: (idx: number) => void;
  onMove: (idx: number, dir: 'up' | 'down') => void;
}) {
  const router = useRouter();
  const doneCount = items.filter(i => i.done).length;
  const activeCount = items.filter(i => !i.skipped).length;
  const allDone = activeCount > 0 && items.filter(i => !i.skipped).every(i => i.done);

  const [transitTo, setTransitTo] = React.useState<RouteStop | null>(null);
  const handleTransitDismiss = React.useCallback(() => setTransitTo(null), []);

  function handleDone(idx: number) {
    // Compute next stop from current items BEFORE onDone triggers parent re-render.
    const nextStop = items.slice(idx + 1).find(it => !it.done && !it.skipped);
    onDone(idx);
    setTransitTo(nextStop?.stop ?? null);
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

      {allDone && (
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={motionTokens.spring.lively}
          className="mb-3 items-center"
        >
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
          canModify={canModify}
          onDone={() => handleDone(i)}
          onSkip={() => onSkip(i)}
          onMove={dir => onMove(i, dir)}
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
      clearTrackingBlock();
      // Stop background location ONLY here — never in a useEffect cleanup,
      // which fires on any unmount (e.g. navigating to upload screen mid-shift).
      await stopShiftTracking();
      queryClient.invalidateQueries({ queryKey: ['driver-campaign'] });
      showMessage({ message: 'Shift ended. Good work!', type: 'success' });
    },
    onError: async (err: Error) => {
      // Server failed to record shift end — still stop local tracking/MMKV so we
      // never broadcast with a stale active_shift_id. User can tap End Shift again.
      const openShift = campaign!.driver_shifts.find(s => !s.ended_at);
      if (openShift?.id)
        blockTrackingForShift(openShift.id);
      await stopShiftTracking().catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['driver-campaign'] });
      showMessage({
        message: 'Could not end shift on server',
        description:
          `${err.message}\n\nLocation tracking was stopped on this device. Tap End Shift again to retry.`,
        type: 'danger',
        duration: 12000,
      });
    },
  });

  return { startMutation, endMutation };
}

// ─── Stop state (lifted out of RouteStopsCard so RouteMapCard can share it) ──

function useStopState(
  stops: RouteStop[],
  activeShift: DriverCampaignData['driver_shifts'][number] | undefined,
  opts: { shiftId: string | undefined; driverCoord: [number, number] | null },
) {
  const { shiftId, driverCoord } = opts;
  const completedStopIds = activeShift?.shift_stop_completions.map(c => c.stop_id) ?? [];
  const [items, setItems] = React.useState<StopState[]>(
    () => stops.map(s => ({ stop: s, done: completedStopIds.includes(s.id), skipped: false })),
  );
  // Fast path above handles the case where React Query has data in cache at mount.
  // Seeding effect handles the common case: CampaignScreen mounts during loading
  // (stops=[]), so the lazy initialiser produces items=[]. When data arrives and
  // stops becomes non-empty, this effect seeds items exactly once.
  const seededRef = React.useRef(stops.length > 0);
  React.useEffect(() => {
    if (seededRef.current || stops.length === 0)
      return;
    seededRef.current = true;
    const ids = activeShift?.shift_stop_completions.map(c => c.stop_id) ?? [];
    setItems(stops.map(s => ({ stop: s, done: ids.includes(s.id), skipped: false })));
  }, [stops, activeShift]);
  // Ref so markDone always captures the latest GPS position without
  // needing driverCoord in its closure (avoids stale value on fast taps).
  const driverCoordRef = React.useRef(driverCoord);
  React.useEffect(() => {
    driverCoordRef.current = driverCoord;
  }, [driverCoord]);

  function markDone(idx: number) {
    const item = items[idx];
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, done: true } : it)));
    if (shiftId && item) {
      completeStop(shiftId, item.stop.id, driverCoordRef.current ?? undefined).catch(() => {
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

  return { items, markDone, markSkip, moveStop };
}

const PROXIMITY_ARRIVAL_M = 150;
const PROXIMITY_HYSTERESIS_M = 300;

function useProximityNudge(
  driverCoord: [number, number] | null,
  items: StopState[],
): { nearbyStopId: string | null; dismissNudge: (stopId: string) => void } {
  const [nearbyStopId, setNearbyStopId] = React.useState<string | null>(null);
  const dismissedRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (!driverCoord) {
      setNearbyStopId(null);
      return;
    }
    let found: string | null = null;
    for (const it of items) {
      if (it.done || it.skipped || it.stop.latitude == null || it.stop.longitude == null)
        continue;
      const dist = haversineMeters(driverCoord, [it.stop.longitude, it.stop.latitude]);
      if (dist > PROXIMITY_HYSTERESIS_M)
        dismissedRef.current.delete(it.stop.id);
      if (dist <= PROXIMITY_ARRIVAL_M && !dismissedRef.current.has(it.stop.id)) {
        found = it.stop.id;
        break;
      }
    }
    setNearbyStopId(found);
  }, [driverCoord, items]);

  const dismissNudge = React.useCallback((stopId: string) => {
    dismissedRef.current.add(stopId);
    setNearbyStopId(null);
  }, []);

  return { nearbyStopId, dismissNudge };
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
  items: StopState[];
  canModify: boolean;
  onDone: (idx: number) => void;
  onSkip: (idx: number) => void;
  onMove: (idx: number, dir: 'up' | 'down') => void;
  nearbyStopId: string | null;
  dismissNudge: (stopId: string) => void;
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
  items,
  canModify,
  onDone,
  onSkip,
  onMove,
  nearbyStopId,
  dismissNudge,
}: ActiveCampaignProps) {
  const router = useRouter();
  const nearbyIdx = nearbyStopId != null ? items.findIndex(it => it.stop.id === nearbyStopId) : -1;
  const statusChip = (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={motionTokens.spring.lively}
    >
      <StatusBadge status={activeShift ? 'active' : campaign.status} />
    </MotiView>
  );

  return (
    <View testID="driver-campaign-screen" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <CampaignHeader
        right={<CampaignHeaderActions status={statusChip} onAnalytics={() => router.push('/(app)/driver-analytics')} onSignOut={signOut} />}
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
        {activeShift != null && nearbyIdx >= 0
          ? (
              <ProximityNudgeBanner
                stopName={items[nearbyIdx].stop.venue_name}
                onDone={() => onDone(nearbyIdx)}
                onDismiss={() => dismissNudge(nearbyStopId!)}
              />
            )
          : null}
        {activeShift && items.length >= 2 && (
          <RouteMapCard items={items} driverCoord={driverCoord} nearbyStopId={nearbyStopId} />
        )}
        {items.length > 0 && (
          <RouteStopsCard
            items={items}
            canModify={canModify}
            onDone={onDone}
            onSkip={onSkip}
            onMove={onMove}
          />
        )}
        {recentPhotos.length > 0 ? <RecentUploadsList photos={recentPhotos} /> : null}
        {profileId ? <PastCampaignsAccordion driverId={profileId} /> : null}
      </ScrollView>
    </View>
  );
}

function useDevRouteSimulation(
  campaign: Awaited<ReturnType<typeof fetchDriverCampaign>>,
  activeShiftId: string | undefined,
  setDriverCoord: React.Dispatch<React.SetStateAction<[number, number] | null>>,
): void {
  const simulationPoints = React.useMemo(
    () => buildRouteSimulationPoints(campaign?.routes?.route_stops ?? []),
    [campaign?.routes?.route_stops],
  );
  React.useEffect(() => {
    if (!DEV_ROUTE_SIMULATION_ENABLED || simulationPoints.length < 2 || !activeShiftId)
      return;
    return startRouteSimulation(simulationPoints, setDriverCoord, { stepMs: 2500, loop: true });
  }, [activeShiftId, setDriverCoord, simulationPoints]);
}

// eslint-disable-next-line max-lines-per-function
export function CampaignScreen() {
  const profile = useAuthStore.use.profile();
  const signOut = useAuthStore.use.signOut();
  const router = useRouter();
  const [showSplash, setShowSplash] = React.useState(true);
  const handleSplashDone = React.useCallback(() => setShowSplash(false), []);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [burstVisible, setBurstVisible] = React.useState(false);
  const pendingNavRef = React.useRef<null | (() => void)>(null);
  const burstCompletedRef = React.useRef(false);
  const [driverCoord, setDriverCoord] = React.useState<[number, number] | null>(null);
  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['driver-campaign', profile?.id],
    queryFn: () => fetchDriverCampaign(profile!.id),
    enabled: !!profile?.id,
  });

  const { startMutation, endMutation } = useShiftMutations(campaign ?? null);
  const activeShift = campaign?.driver_shifts.find(s => !s.ended_at);
  const activeShiftId = activeShift?.id;
  const { items, markDone, markSkip, moveStop } = useStopState(campaign?.routes?.route_stops ?? [], activeShift, { shiftId: activeShiftId, driverCoord });
  const { nearbyStopId, dismissNudge } = useProximityNudge(driverCoord, items);
  useDevRouteSimulation(campaign ?? null, activeShiftId, setDriverCoord);
  useDriverPositionPublisher(activeShiftId, driverCoord);
  React.useEffect(() => {
    if (!activeShiftId) {
      clearTrackingBlock();
      return;
    }
    const cached = getLastKnownTrackingCoordForShift(activeShiftId);
    if (cached)
      setDriverCoord(cached.coord);
    let sub: Location.LocationSubscription | null = null;
    const startWatcher = async () => {
      try {
        // Request foreground permission first (required before background on Android)
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== 'granted')
          return;

        // On Android emulator (API 36) FusedLocationProvider blocks watchPositionAsync
        // with "too close" even across large distances. Priming with getCurrentPositionAsync
        // wakes the provider; distanceInterval 0 removes the "too close" filter.
        if (__DEV__)
          await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => {});

        // Foreground watcher — drives the map dot while the app is visible
        sub = await Location.watchPositionAsync(
          {
            accuracy: __DEV__ ? Location.Accuracy.High : Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: __DEV__ ? 0 : 10,
          },
          pos => setDriverCoord([pos.coords.longitude, pos.coords.latitude]),
        );

        // Request background permission (Android 10+ requires a separate prompt
        // after foreground is granted; iOS handles it via NSLocationAlwaysAndWhenInUse)
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus !== 'granted') {
          // Foreground tracking still works — background broadcast won't fire
          return;
        }

        // Start background location task (no-op if already running from a
        // previous session where the driver backgrounded without ending the shift).
        // Skip restart after a failed endShift for this shift until retry succeeds.
        if (!isTrackingBlockedFor(activeShiftId))
          await startShiftTracking(activeShiftId);
      }
      catch {
        // Location unavailable (emulator, permissions denied, etc.) — silent fail
      }
    };
    startWatcher();
    // Cleanup removes ONLY the foreground subscription.
    // stopShiftTracking() is deliberately NOT called here — that belongs in
    // the End Shift onSuccess so the OS task survives component unmounts.
    return () => {
      sub?.remove();
    };
  }, [activeShiftId]);
  const handleStartShift = React.useCallback(() => {
    burstCompletedRef.current = false;
    pendingNavRef.current = null;
    setBurstVisible(true);
    startMutation.mutate(undefined, {
      onSuccess: () => {
        const navigateToUpload = () => router.push('/(app)/upload');
        if (burstCompletedRef.current) {
          setBurstVisible(false);
          navigateToUpload();
          return;
        }
        pendingNavRef.current = navigateToUpload;
      },
      onError: () => {
        setBurstVisible(false);
        burstCompletedRef.current = false;
        pendingNavRef.current = null;
      },
    });
  }, [router, startMutation]);

  const handleShiftStartBurstComplete = React.useCallback(() => {
    burstCompletedRef.current = true;
    setBurstVisible(false);
    const pendingNav = pendingNavRef.current;
    pendingNavRef.current = null;
    pendingNav?.();
  }, []);
  const requestSignOutConfirm = React.useCallback(() => {
    setConfirmOpen(true);
  }, []);

  const recentPhotos = getRecentPhotos(campaign);

  const logoutDialog = (
    <LogoutConfirmDialog
      visible={confirmOpen}
      onCancel={() => setConfirmOpen(false)}
      onConfirm={() => {
        setConfirmOpen(false);
        void signOut();
      }}
    />
  );

  if (isLoading) {
    return (
      <>
        <View className="flex-1 items-center justify-center bg-white dark:bg-black"><SpinnerAnimation size={64} /></View>
        {logoutDialog}
      </>
    );
  }
  if (error || !campaign) {
    return (
      <>
        <EmptyCampaignState onSignOut={requestSignOutConfirm} />
        {logoutDialog}
      </>
    );
  }
  if (showSplash) {
    return (
      <>
        <DriverLaunchSplash onDone={handleSplashDone} />
        {logoutDialog}
      </>
    );
  }

  return (
    <>
      <ActiveCampaignView
        campaign={campaign}
        activeShift={activeShift}
        driverCoord={driverCoord}
        signOut={requestSignOutConfirm}
        onStartShift={handleStartShift}
        isStartPending={startMutation.isPending}
        onEndShift={() => endMutation.mutate()}
        isEndPending={endMutation.isPending}
        recentPhotos={recentPhotos}
        profileId={profile?.id}
        items={items}
        canModify={campaign.driver_can_modify_route}
        onDone={markDone}
        onSkip={markSkip}
        onMove={moveStop}
        nearbyStopId={nearbyStopId}
        dismissNudge={dismissNudge}
      />
      <ShiftStartBurst visible={burstVisible} onComplete={handleShiftStartBurstComplete} />
      {logoutDialog}
    </>
  );
}
