import type { AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking } from 'react-native';

import { getItem, setItem } from '@/lib/storage';

const DISCLOSURE_KEY = 'bg_location_disclosure_decision';

export type DisclosureDecision = 'accepted' | 'declined' | null;

function readDisclosure(): DisclosureDecision {
  return getItem<DisclosureDecision>(DISCLOSURE_KEY);
}

function writeDisclosure(decision: Exclude<DisclosureDecision, null>) {
  return setItem(DISCLOSURE_KEY, decision);
}

export function useBackgroundLocationPermission() {
  const [osStatus, setOsStatus] = useState<Location.PermissionStatus | 'unknown'>('unknown');
  const [decision, setDecision] = useState<DisclosureDecision>(() => readDisclosure());
  const inFlightRef = useRef<Promise<Location.PermissionStatus> | null>(null);

  const syncOsStatus = useCallback(async () => {
    try {
      const { status } = await Location.getBackgroundPermissionsAsync();
      setOsStatus(status);
      return status;
    }
    catch {
      setOsStatus('unknown');
      return 'unknown' as const;
    }
  }, []);

  useEffect(() => {
    // Initial read + resync on foreground: the OS permission is an external
    // system whose state can change while we're backgrounded (driver toggled
    // it in Settings). setState inside these callbacks is the standard
    // subscribe pattern, not a render-cascade anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncOsStatus();
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active')
        syncOsStatus();
    });
    return () => sub.remove();
  }, [syncOsStatus]);

  const requestWithDisclosure = useCallback(async (): Promise<Location.PermissionStatus | 'unknown'> => {
    if (inFlightRef.current)
      return inFlightRef.current;

    // If the OS already grants it (carried over from a prior session), skip
    // both the disclosure and the OS prompt — no user-visible noise.
    const { status: current } = await Location.getBackgroundPermissionsAsync();
    if (current === 'granted') {
      setOsStatus(current);
      return current;
    }

    const stored = readDisclosure();

    // Respect a prior decline — never re-prompt disclosure or OS.
    // Banner + Settings is the only path back.
    if (stored === 'declined') {
      setOsStatus(current);
      return current;
    }

    if (stored === 'accepted') {
      // Already disclosed once and OS has not yet granted — prompt the OS directly.
      const prompt = Location.requestBackgroundPermissionsAsync().then(r => r.status);
      inFlightRef.current = prompt;
      const next = await prompt;
      inFlightRef.current = null;
      setOsStatus(next);
      return next;
    }

    // First contact — Prominent Disclosure required by Play policy before any OS prompt.
    const accepted = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Background location',
        'LoneStar Fleet collects location data to share your position with your dispatcher during an active shift, even when the app is closed. Location collection stops when you end your shift.',
        [
          { text: 'Decline', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Accept', onPress: () => resolve(true) },
        ],
        { cancelable: false },
      );
    });

    if (!accepted) {
      await writeDisclosure('declined');
      setDecision('declined');
      return syncOsStatus();
    }

    await writeDisclosure('accepted');
    setDecision('accepted');

    const prompt = Location.requestBackgroundPermissionsAsync().then(r => r.status);
    inFlightRef.current = prompt;
    const next = await prompt;
    inFlightRef.current = null;
    setOsStatus(next);
    return next;
  }, [syncOsStatus]);

  const openSettings = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  return {
    osStatus,
    decision,
    requestWithDisclosure,
    openSettings,
    refresh: syncOsStatus,
  };
}
