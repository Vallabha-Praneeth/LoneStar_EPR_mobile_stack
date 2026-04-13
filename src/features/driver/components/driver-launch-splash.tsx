import * as Location from 'expo-location';
import { MotiView } from 'moti';
import * as React from 'react';

import { TruckAnimation } from '@/components/motion';
import { Text, View } from '@/components/ui';
import { motionTokens } from '@/lib/motion/tokens';

type Props = { onDone: () => void };

type SplashMode = 'moving' | 'parked';

export function DriverLaunchSplash({ onDone }: Props) {
  const [mode, setMode] = React.useState<SplashMode>('parked');

  React.useEffect(() => {
    let cancelled = false;

    async function detectMode() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted')
          return;
        const pos = await Location.getLastKnownPositionAsync({});
        if (!cancelled && pos?.coords.speed != null && pos.coords.speed > 1.5) {
          setMode('moving');
        }
      }
      catch {
        // location unavailable — stay on 'parked'
      }
    }

    detectMode();
    const t = setTimeout(() => {
      if (!cancelled)
        onDone();
    }, 1500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [onDone]);

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
      <MotiView
        from={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={motionTokens.spring.gentle}
        className="items-center gap-5"
      >
        <TruckAnimation size={200} />
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 300 }}
          className="items-center gap-1"
        >
          <Text className="text-lg font-bold">
            {mode === 'moving' ? 'Loading Collection' : 'Vehicle Parked'}
          </Text>
          <Text className="text-sm text-neutral-500">
            {mode === 'moving' ? 'On the road…' : 'Ready for your campaign'}
          </Text>
        </MotiView>
      </MotiView>
    </View>
  );
}
