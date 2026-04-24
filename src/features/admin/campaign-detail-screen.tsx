import type { CampaignDetail } from '@/lib/api/admin/campaigns';
import type { RouteStopRow } from '@/lib/api/admin/routes';
import { GeoJSONSource, Layer, Marker, Camera as MLCamera, Map as MLMap } from '@maplibre/maplibre-react-native';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  View as RNView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { AdminHeader } from '@/components/admin-header';
import { AdminSettingsGearButton } from '@/components/admin-settings-gear';
import { CampaignStageProgress } from '@/components/campaign-stage-progress';
import { DetachedMapModal } from '@/components/detached-map-modal';
import { DriverTransitBadge } from '@/components/driver-transit-badge';
import { InfoCard } from '@/components/info-card';
import { StatusBadge } from '@/components/status-badge';
import { Card, Text, View } from '@/components/ui';
import { DollarSign, MapPin, Truck, User } from '@/components/ui/icons';
import { useDetachedMapExpand } from '@/components/use-detached-map-expand';
import { fetchCampaignDetail } from '@/lib/api/admin/campaigns';
import { getSignedUrl } from '@/lib/api/admin/photos';
import { fetchRouteById } from '@/lib/api/admin/routes';
import { useDriverPositionSubscriberSnapshot } from '@/lib/realtime/driver-location';
import { useSmoothedLiveCoord } from '@/lib/realtime/live-map-motion';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const liveMapStyles = StyleSheet.create({
  cardMap: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  fullMap: { flex: 1 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#3b82f6', borderWidth: 2, borderColor: '#fff' },
  stopDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#f59e0b', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});

type MapContentProps = {
  coord: [number, number] | null;
  lineGeoJson: GeoJSON.Feature | null;
  stopsWithCoords: RouteStopRow[];
  mapId: string;
  fullscreen: boolean;
};

function MapContent({ coord, lineGeoJson, stopsWithCoords, mapId, fullscreen }: MapContentProps) {
  const mapCenter: [number, number] = coord ?? [0, 0];
  return (
    <MLMap
      style={fullscreen ? liveMapStyles.fullMap : liveMapStyles.cardMap}
      mapStyle={MAP_STYLE}
      logo={false}
      attribution={false}
      dragPan={fullscreen}
      touchZoom={fullscreen}
      doubleTapZoom={fullscreen}
    >
      <MLCamera center={mapCenter} zoom={13} />
      {lineGeoJson && (
        <GeoJSONSource id={`route-line-${mapId}`} data={lineGeoJson}>
          <Layer
            id={`route-line-layer-${mapId}`}
            type="line"
            style={{ lineColor: '#3b82f6', lineWidth: 3, lineOpacity: 0.7 }}
          />
        </GeoJSONSource>
      )}
      {stopsWithCoords.map((stop, i) => (
        <Marker key={stop.id} id={`stop-${stop.id}`} lngLat={[stop.longitude!, stop.latitude!]}>
          <RNView style={liveMapStyles.stopDot}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>{i + 1}</Text>
          </RNView>
        </Marker>
      ))}
      {coord != null && (
        <Marker id={`live-driver-${mapId}`} lngLat={coord}>
          <RNView style={liveMapStyles.dot} />
        </Marker>
      )}
    </MLMap>
  );
}

function useRouteStops(routeId: string | null) {
  const { data: routeDetail } = useQuery({
    queryKey: ['admin-route-detail', routeId],
    queryFn: () => fetchRouteById(routeId!),
    enabled: !!routeId,
  });
  const stopsWithCoords = React.useMemo(
    () => (routeDetail?.route_stops ?? []).filter(s => s.latitude != null && s.longitude != null),
    [routeDetail],
  );
  const lineGeoJson = React.useMemo<GeoJSON.Feature | null>(() => {
    if (stopsWithCoords.length < 2) {
      return null;
    }
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: stopsWithCoords.map(s => [s.longitude!, s.latitude!]),
      },
    };
  }, [stopsWithCoords]);
  return { stopsWithCoords, lineGeoJson };
}

type LiveDriverCardProps = { shiftId: string; routeId: string | null };

function LiveDriverCard({ shiftId, routeId }: LiveDriverCardProps) {
  const snapshot = useDriverPositionSubscriberSnapshot(shiftId);
  const coord = useSmoothedLiveCoord(snapshot);
  const [now, setNow] = React.useState(Date.now);
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  const isStale = snapshot != null && now - snapshot.ts > 60_000;
  const { stopsWithCoords, lineGeoJson } = useRouteStops(routeId);
  const cardRef = React.useRef<RNView>(null);
  const { showModal, openMap, closeMap, expandedViewStyle, backdropStyle } = useDetachedMapExpand(cardRef, 200);

  return (
    <View className="gap-2">
      <DriverTransitBadge />
      <TouchableOpacity activeOpacity={0.9} onPress={coord != null ? openMap : undefined}>
        <RNView ref={cardRef} style={{ height: 200, borderRadius: 12, overflow: 'hidden' }}>
          {coord != null
            ? (
                <MapContent
                  coord={coord}
                  lineGeoJson={lineGeoJson}
                  stopsWithCoords={stopsWithCoords}
                  mapId="card"
                  fullscreen={false}
                />
              )
            : (
                <RNView style={{ flex: 1, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                  <Text className="text-xs text-neutral-400">Waiting for driver location…</Text>
                </RNView>
              )}
        </RNView>
      </TouchableOpacity>

      {isStale && (
        <Text className="text-xs text-amber-500">
          {`Last seen ${format(new Date(snapshot!.ts), 'h:mm a')}`}
        </Text>
      )}

      <DetachedMapModal
        visible={showModal}
        closeMap={closeMap}
        expandedViewStyle={expandedViewStyle}
        backdropStyle={backdropStyle}
      >
        <MapContent
          coord={coord}
          lineGeoJson={lineGeoJson}
          stopsWithCoords={stopsWithCoords}
          mapId="full"
          fullscreen
        />
      </DetachedMapModal>
    </View>
  );
}

function PhotosSectionHeader({ status, photoCount }: { status: string; photoCount: number }) {
  return (
    <>
      <CampaignStageProgress status={status} />
      <View className="mt-2">
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
          <InfoCard icon={<User color="#9A7B45" width={16} height={16} />} label="Client" value={campaign.clients?.name ?? 'No client'} />
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
                <InfoCard icon={<DollarSign color="#9A7B45" width={16} height={16} />} label={cost.cost_types?.name ?? 'Cost'} value={`$${cost.amount}`} />
              </View>
            </View>
          ))}
        </View>
      )}

      <InfoCard icon={<DollarSign color="#9A7B45" width={16} height={16} />} label="Total Cost" value={`$${totalCost}`} />

      {campaign.internal_notes && (
        <Card className="rounded-xl p-4">
          <Text className="mb-1 text-xs text-neutral-500">Notes</Text>
          <Text className="text-sm">{campaign.internal_notes}</Text>
        </Card>
      )}

      {activeShift ? <LiveDriverCard shiftId={activeShift.id} routeId={campaign.route_id} /> : null}

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
