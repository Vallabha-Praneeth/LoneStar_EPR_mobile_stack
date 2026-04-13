import { MotiView } from 'moti';
import * as React from 'react';

import { TruckAnimation } from '@/components/motion';
import { Text, View } from '@/components/ui';
import { motionTokens } from '@/lib/motion/tokens';

/**
 * Shown when a driver shift is active — communicates "driver is on the road".
 * Used on admin campaign detail and client campaign screens.
 */
export function DriverTransitBadge() {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -8 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ ...motionTokens.spring.lively }}
      className="flex-row items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/30"
    >
      <TruckAnimation size={48} />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          Driver Active
        </Text>
        <Text className="text-xs text-blue-500 dark:text-blue-400">
          Campaign in progress — driver on the road
        </Text>
      </View>
      {/* pulsing live dot */}
      <View className="size-5 items-center justify-center">
        <MotiView
          from={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2.0, opacity: 0 }}
          transition={{ type: 'timing', duration: 1200, loop: true }}
          className="absolute size-2.5 rounded-full bg-blue-500"
        />
        <View className="size-2.5 rounded-full bg-blue-500" />
      </View>
    </MotiView>
  );
}
