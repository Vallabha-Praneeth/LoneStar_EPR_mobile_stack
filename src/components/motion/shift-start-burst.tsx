import * as React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Rive, { Alignment, Fit } from 'rive-react-native';

import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

import { riveAssets } from './rive-assets';

const FALLBACK_MS = 2500;

type ShiftStartBurstProps = {
  visible: boolean;
  onComplete: () => void;
};

export function ShiftStartBurst({ visible, onComplete }: ShiftStartBurstProps) {
  const reducedMotion = useReducedMotion();
  const completeOnceRef = React.useRef(false);

  const handleComplete = React.useCallback(() => {
    if (completeOnceRef.current) {
      return;
    }
    completeOnceRef.current = true;
    onComplete();
  }, [onComplete]);

  React.useEffect(() => {
    if (!visible) {
      completeOnceRef.current = false;
      return;
    }

    if (reducedMotion) {
      handleComplete();
      return;
    }

    const timeoutId = setTimeout(handleComplete, FALLBACK_MS);
    return () => clearTimeout(timeoutId);
  }, [handleComplete, reducedMotion, visible]);

  if (!visible || reducedMotion) {
    return null;
  }

  return (
    <Modal transparent visible animationType="fade">
      <View testID="shift-start-burst" style={styles.backdrop}>
        <View style={styles.player}>
          <Rive
            source={riveAssets.shiftStart}
            fit={Fit.Contain}
            alignment={Alignment.Center}
            autoplay
            {...({
              onStateChanged: handleComplete,
            } as { onStateChanged: () => void })}
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  player: {
    width: '100%',
    height: '80%',
  },
});
