import { MotiView } from 'moti';
import * as React from 'react';
import { Modal } from 'react-native';

import { TruckAnimation } from '@/components/motion';
import { Text, View } from '@/components/ui';
import { motionTokens } from '@/lib/motion/tokens';

type Props = {
  visible: boolean;
  nextStopName: string | null;
  onDismiss: () => void;
};

export function StopTransitOverlay({ visible, nextStopName, onDismiss }: Props) {
  React.useEffect(() => {
    if (!visible)
      return;
    const t = setTimeout(onDismiss, 2500);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/80">
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={motionTokens.spring.lively}
          className="w-72 items-center gap-4 rounded-3xl bg-white p-8 dark:bg-neutral-800"
        >
          <TruckAnimation size={160} />
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 200 }}
            className="items-center gap-1"
          >
            <Text className="text-xs font-medium tracking-widest text-neutral-400 uppercase">
              En route to
            </Text>
            <Text className="text-center text-base font-bold">
              {nextStopName ?? 'Next Stop'}
            </Text>
          </MotiView>
          {/* animated progress dots */}
          <View className="flex-row gap-2">
            {[0, 200, 400].map(delay => (
              <MotiView
                key={delay}
                from={{ scale: 0.6, opacity: 0.3 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'timing', duration: 600, loop: true, repeatReverse: true, delay }}
                className="size-2 rounded-full bg-primary"
              />
            ))}
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}
