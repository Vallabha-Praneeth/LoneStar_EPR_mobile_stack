import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Rive, { Alignment, Fit } from 'rive-react-native';

import { riveAssets } from '@/components/motion/rive-assets';
import { useIsOnline } from '@/lib/hooks/use-is-online';

import { Text } from './text';

export function OfflineOverlay() {
  const { isOnline } = useIsOnline();

  if (isOnline) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      accessibilityLabel="No internet connection"
      accessibilityLiveRegion="polite"
      style={styles.overlay}
      testID="offline-overlay"
    >
      <View style={styles.card}>
        <View style={styles.riveContainer}>
          <Rive
            alignment={Alignment.Center}
            autoplay
            fit={Fit.Contain}
            source={riveAssets.offline}
            style={styles.rive}
          />
        </View>
        <Text className="text-lg font-semibold text-white">You are offline</Text>
        <Text className="text-center text-sm text-neutral-200">
          We will reconnect automatically.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    zIndex: 1000,
  },
  card: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  riveContainer: {
    height: 160,
    width: 220,
  },
  rive: {
    height: '100%',
    width: '100%',
  },
});
