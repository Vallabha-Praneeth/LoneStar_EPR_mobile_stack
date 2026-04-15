import * as React from 'react';

import { supabase } from '@/lib/supabase';

// [longitude, latitude] — MapLibre coordinate order
export type Coord = [number, number];

export type DriverLocationPayload = { lat: number; lng: number; ts: number };
export type DriverPositionSnapshot = { coord: Coord; ts: number };

const PUBLISH_INTERVAL_MS = 10_000; // broadcast at most every 10 s
const SUBSCRIBER_DEDUP_WINDOW_MS = 5_000;

export function driverPositionChannelName(shiftId: string): string {
  return `driver-position:${shiftId}`;
}

/**
 * Publishes the driver's live position to a Supabase Broadcast channel.
 * Used on the driver campaign screen while a shift is active.
 * Throttled to one publish per PUBLISH_INTERVAL_MS regardless of how often
 * coord changes (driver map updates locally every 5 s).
 */
export function useDriverPositionPublisher(
  shiftId: string | undefined,
  coord: Coord | null,
): void {
  const channelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastPublishRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (!shiftId)
      return;
    const ch = supabase.channel(driverPositionChannelName(shiftId));
    ch.subscribe();
    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [shiftId]);

  React.useEffect(() => {
    if (!coord || !channelRef.current)
      return;
    const now = Date.now();
    if (now - lastPublishRef.current < PUBLISH_INTERVAL_MS)
      return;
    lastPublishRef.current = now;
    const payload: DriverLocationPayload = { lat: coord[1], lng: coord[0], ts: now };
    channelRef.current.send({ type: 'broadcast', event: 'location', payload });
  }, [coord]);
}

/**
 * Subscribes to live driver position broadcasts for a given shift.
 * Returns null until the first location message arrives or when shiftId is absent.
 * Includes timestamp so consumers can reason about freshness.
 */
export function useDriverPositionSubscriberSnapshot(
  shiftId: string | null | undefined,
): DriverPositionSnapshot | null {
  const [snapshot, setSnapshot] = React.useState<DriverPositionSnapshot | null>(null);

  React.useEffect(() => {
    if (!shiftId) {
      setSnapshot(null);
      return;
    }
    const ch = supabase
      .channel(driverPositionChannelName(shiftId))
      .on('broadcast', { event: 'location' }, ({ payload }: { payload: DriverLocationPayload }) => {
        const next: DriverPositionSnapshot = {
          coord: [payload.lng, payload.lat],
          ts: payload.ts,
        };
        setSnapshot((prev) => {
          if (!prev)
            return next;
          const sameCoord = prev.coord[0] === next.coord[0] && prev.coord[1] === next.coord[1];
          if (sameCoord && next.ts - prev.ts < SUBSCRIBER_DEDUP_WINDOW_MS)
            return prev;
          return next;
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [shiftId]);

  return snapshot;
}

/**
 * Backward-compatible subscriber returning only coordinate.
 * Prefer `useDriverPositionSubscriberSnapshot` for timestamp-aware consumers.
 */
export function useDriverPositionSubscriber(shiftId: string | null | undefined): Coord | null {
  const snapshot = useDriverPositionSubscriberSnapshot(shiftId);
  return snapshot?.coord ?? null;
}
