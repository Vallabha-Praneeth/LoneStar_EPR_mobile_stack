import * as React from 'react';

import { supabase } from '@/lib/supabase';

// [longitude, latitude] — MapLibre coordinate order
export type Coord = [number, number];

type LocationPayload = { lat: number; lng: number; ts: number };

const PUBLISH_INTERVAL_MS = 10_000; // broadcast at most every 10 s

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
    const ch = supabase.channel(`driver-position:${shiftId}`);
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
    const payload: LocationPayload = { lat: coord[1], lng: coord[0], ts: now };
    channelRef.current.send({ type: 'broadcast', event: 'location', payload });
  }, [coord]);
}

/**
 * Subscribes to live driver position broadcasts for a given shift.
 * Returns null until the first location message arrives or when shiftId is absent.
 * Used on admin campaign detail and client campaign detail screens.
 */
export function useDriverPositionSubscriber(shiftId: string | null | undefined): Coord | null {
  const [coord, setCoord] = React.useState<Coord | null>(null);

  React.useEffect(() => {
    if (!shiftId) {
      setCoord(null);
      return;
    }
    const ch = supabase
      .channel(`driver-position:${shiftId}`)
      .on('broadcast', { event: 'location' }, ({ payload }: { payload: LocationPayload }) => {
        setCoord([payload.lng, payload.lat]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [shiftId]);

  return coord;
}
