/**
 * Background location task for LoneStar Fleet driver shifts.
 *
 * IMPORTANT: This file must be imported at the app entry-point top level
 * (src/app/_layout.tsx) so TaskManager.defineTask executes before the OS
 * ever tries to launch the task. Never import it lazily or inside a component.
 *
 * How it works:
 *  - startShiftTracking(shiftId)  — call when shift starts; stores shiftId in
 *    MMKV and starts Location.startLocationUpdatesAsync.
 *  - stopShiftTracking()          — clears MMKV and stops the OS-level location
 *    task. Called on End Shift success, and on End Shift server failure so local
 *    tracking does not outlive a failed sync (never from useEffect cleanup).
 *  - The TaskManager callback reads shiftId from MMKV, then broadcasts the
 *    coordinate via supabase.channel().send() BEFORE subscribing, which makes
 *    supabase-js use HTTP (no WebSocket needed in a background/headless context).
 *    Confirmed endpoint: https://<ref>.supabase.co/realtime/v1/api/broadcast
 *    Topic format: the raw channel name (e.g. "driver-position:<shiftId>") —
 *    no "realtime:" prefix — as documented at supabase.com/docs/guides/realtime/broadcast
 */
import type { LocationObject } from 'expo-location';
import type { TaskManagerTaskBody } from 'expo-task-manager';

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { driverPositionChannelName } from '@/lib/realtime/driver-location';
import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

export const BACKGROUND_LOCATION_TASK = 'LONESTAR_FLEET_BACKGROUND_LOCATION';
export const MMKV_SHIFT_ID_KEY = 'active_shift_id';
export const MMKV_LAST_COORD_KEY = 'driver_last_coord';

type LastKnownDriverCoord = {
  shiftId: string;
  lat: number;
  lng: number;
  ts: number;
};

type TaskData = { locations: LocationObject[] };

function readLastKnownTrackingCoord(): LastKnownDriverCoord | null {
  const raw = storage.getString(MMKV_LAST_COORD_KEY);
  if (!raw)
    return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LastKnownDriverCoord>;
    if (
      typeof parsed?.shiftId !== 'string'
      || typeof parsed?.lat !== 'number'
      || typeof parsed?.lng !== 'number'
      || typeof parsed?.ts !== 'number'
    ) {
      return null;
    }
    return parsed as LastKnownDriverCoord;
  }
  catch {
    return null;
  }
}

export function getLastKnownTrackingCoordForShift(shiftId: string): { coord: [number, number]; ts: number } | null {
  const last = readLastKnownTrackingCoord();
  if (!last || last.shiftId !== shiftId)
    return null;
  return {
    coord: [last.lng, last.lat],
    ts: last.ts,
  };
}

// ─── Task definition (must be at module top-level) ────────────────────────────

TaskManager.defineTask(
  BACKGROUND_LOCATION_TASK,
  async ({ data, error }: TaskManagerTaskBody<TaskData>) => {
    if (error || !data)
      return;

    const location = data.locations[0];
    if (!location)
      return;

    const shiftId = storage.getString(MMKV_SHIFT_ID_KEY) ?? null;
    if (!shiftId)
      return;

    const { latitude, longitude } = location.coords;
    const ts = Date.now();
    storage.set(
      MMKV_LAST_COORD_KEY,
      JSON.stringify({ shiftId, lat: latitude, lng: longitude, ts }),
    );
    const channel = supabase.channel(driverPositionChannelName(shiftId));

    // Calling .send() before .subscribe() uses HTTP (not WebSocket).
    // supabase-js 2.37.0+ feature — safe in headless/background context.
    await channel
      .send({
        type: 'broadcast',
        event: 'location',
        payload: { lat: latitude, lng: longitude, ts },
      })
      .catch(() => {
        // Silent fail — background tasks must never throw
      });

    supabase.removeChannel(channel);
  },
);

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Stores shiftId in MMKV (so the task callback can read it) and starts the
 * OS-level background location task if it is not already running.
 * Safe to call multiple times — no-ops if the task is already active.
 */
export async function startShiftTracking(shiftId: string): Promise<void> {
  storage.set(MMKV_SHIFT_ID_KEY, shiftId);

  const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK,
  ).catch(() => false);

  if (alreadyRunning)
    return;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 15_000, // 15 s — battery-friendly for a driving use case
    distanceInterval: 20, // or 20 m moved, whichever fires first
    showsBackgroundLocationIndicator: true, // iOS: blue pill in status bar
    foregroundService: {
      // Android: keeps the task alive as a foreground service
      notificationTitle: 'LoneStar Fleet shift in progress',
      notificationBody: 'Location is being tracked during your shift.',
      notificationColor: '#1d4ed8',
    },
    pausesUpdatesAutomatically: false,
  });
}

/**
 * Stops the OS-level background location task and clears the stored shiftId.
 * Do not call from useEffect cleanup (unmount/navigation must not stop tracking).
 * Call from End Shift mutation success, or from End Shift mutation error after a
 * failed server update so MMKV/orphan broadcasts cannot continue.
 */
export async function stopShiftTracking(): Promise<void> {
  storage.remove(MMKV_SHIFT_ID_KEY);
  storage.remove(MMKV_LAST_COORD_KEY);

  const running = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK,
  ).catch(() => false);

  if (running) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => {});
  }
}
