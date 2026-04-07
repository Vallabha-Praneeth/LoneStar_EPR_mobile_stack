import { MotiView } from 'moti';
import * as React from 'react';
import { CheckCircle } from '@/components/ui/icons';
import { motionTokens } from '@/lib/motion/tokens';

type Props = {
  size?: number;
  iconColor?: string;
};

export function AnimatedSuccessBadge({ size = 80, iconColor = '#16a34a' }: Props) {
  const iconSize = Math.round(size * 0.5);

  return (
    <MotiView
      from={{ scale: 0.86, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={motionTokens.spring.lively}
      style={{ width: size, height: size }}
      className="items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
    >
      <MotiView
        from={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'timing',
          duration: motionTokens.duration.base,
          delay: motionTokens.duration.fast,
        }}
      >
        <CheckCircle color={iconColor} width={iconSize} height={iconSize} />
      </MotiView>
    </MotiView>
  );
}
