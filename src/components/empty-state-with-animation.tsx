import type { LottieViewSource } from '@/components/motion';
import { MotiView } from 'moti';
import * as React from 'react';
import { LottieAnimation } from '@/components/motion';
import { Text } from '@/components/ui';
import { motionTokens } from '@/lib/motion/tokens';

type Props = {
  message: string;
  source: LottieViewSource;
  testID?: string;
  size?: number;
  className?: string;
  entranceDurationMs?: number;
  entranceOffsetY?: number;
};

export function EmptyStateWithAnimation({
  message,
  source,
  testID,
  size = 84,
  className = '',
  entranceDurationMs = motionTokens.duration.base,
  entranceOffsetY = 8,
}: Props) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: entranceOffsetY }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: entranceDurationMs }}
      className={`items-center py-16 ${className}`.trim()}
    >
      <LottieAnimation
        source={source}
        size={size}
        loop
        autoPlay
        testID={testID}
      />
      <Text className="mt-3 text-sm text-neutral-500">{message}</Text>
    </MotiView>
  );
}
