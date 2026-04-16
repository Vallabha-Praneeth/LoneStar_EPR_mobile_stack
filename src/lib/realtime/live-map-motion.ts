import type { Coord } from '@/lib/realtime/driver-location';

import * as React from 'react';
import { haversineMeters } from '@/lib/geo/haversine';

type PositionSnapshot = { coord: Coord; ts: number };

// Ignore tiny "drift" when effectively stationary.
const STATIONARY_JITTER_METERS = 8;
const STATIONARY_JITTER_WINDOW_MS = 20_000;

// Ignore obvious GPS spikes that imply impossible speed over short windows.
const MIN_DISTANCE_FOR_SPEED_CHECK_METERS = 60;
const MAX_REALISTIC_SPEED_MPS = 55; // ~198 km/h
const UNREALISTIC_REJECT_WINDOW_MS = 6_000;

// Large jumps are snapped instead of animated to avoid "flying marker" artifacts.
const SNAP_DISTANCE_METERS = 250;

const MIN_INTERPOLATION_MS = 250;
const MAX_INTERPOLATION_MS = 1_800;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function interpolate(from: Coord, to: Coord, t: number): Coord {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
  ];
}

function computeInterpolationMs(distanceMeters: number, deltaMs: number): number {
  const byDistance = (distanceMeters / 25) * 1000; // reference ~25 m/s
  const byCadence = deltaMs * 0.6;
  return clamp(Math.max(400, byDistance, byCadence), MIN_INTERPOLATION_MS, MAX_INTERPOLATION_MS);
}

export function useSmoothedLiveCoord(snapshot: PositionSnapshot | null): Coord | null {
  const [coord, setCoord] = React.useState<Coord | null>(snapshot?.coord ?? null);
  const displayedRef = React.useRef<Coord | null>(snapshot?.coord ?? null);
  const acceptedRef = React.useRef<PositionSnapshot | null>(snapshot);
  const frameRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (frameRef.current != null)
        cancelAnimationFrame(frameRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (!snapshot) {
      acceptedRef.current = null;
      displayedRef.current = null;
      setCoord(null);
      return;
    }

    const prev = acceptedRef.current;
    if (!prev) {
      acceptedRef.current = snapshot;
      displayedRef.current = snapshot.coord;
      setCoord(snapshot.coord);
      return;
    }

    const dtMs = Math.max(1, snapshot.ts - prev.ts);
    const distanceMeters = haversineMeters(prev.coord, snapshot.coord);

    // Stationary jitter suppression: keep latest ts but keep same displayed coord.
    if (distanceMeters < STATIONARY_JITTER_METERS && dtMs < STATIONARY_JITTER_WINDOW_MS) {
      acceptedRef.current = { coord: prev.coord, ts: snapshot.ts };
      return;
    }

    const speedMps = distanceMeters / (dtMs / 1000);
    const unrealisticJump = distanceMeters >= MIN_DISTANCE_FOR_SPEED_CHECK_METERS && speedMps > MAX_REALISTIC_SPEED_MPS;
    if (unrealisticJump && dtMs < UNREALISTIC_REJECT_WINDOW_MS) {
      // Likely transient GPS spike; ignore.
      return;
    }

    acceptedRef.current = snapshot;

    if (frameRef.current != null)
      cancelAnimationFrame(frameRef.current);

    const start = displayedRef.current ?? prev.coord;
    if (distanceMeters >= SNAP_DISTANCE_METERS) {
      displayedRef.current = snapshot.coord;
      setCoord(snapshot.coord);
      return;
    }

    const durationMs = computeInterpolationMs(distanceMeters, dtMs);
    const startedAt = Date.now();

    const tick = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / durationMs);
      const next = interpolate(start, snapshot.coord, progress);
      displayedRef.current = next;
      setCoord(next);
      if (progress < 1)
        frameRef.current = requestAnimationFrame(tick);
      else
        frameRef.current = null;
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [snapshot]);

  return coord;
}
