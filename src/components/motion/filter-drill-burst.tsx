import LottieView from 'lottie-react-native';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

import { lottieAssets } from './lottie-assets';

const BURST_VISIBILITY_MS = 2100;
const BURST_SIZE = 240;
const OPTICAL_CENTER_Y_OFFSET = 76;

type FilterDrillBurstProps = {
  trigger: string | number | null;
  accessibilityLabel?: string;
  source?: React.ComponentProps<typeof LottieView>['source'];
};

export function FilterDrillBurst({
  trigger,
  accessibilityLabel,
  source = lottieAssets.filterDrill,
}: FilterDrillBurstProps) {
  const reducedMotion = useReducedMotion();
  const previousTriggerRef = React.useRef<string | number | null>(trigger);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [playCount, setPlayCount] = React.useState(0);
  const shouldAnnounce = Boolean(accessibilityLabel);

  const clearHideTimer = React.useCallback(() => {
    if (!hideTimerRef.current) {
      return;
    }

    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  }, []);

  const showBurst = React.useCallback(() => {
    setPlayCount(count => count + 1);
    setIsVisible(true);
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      hideTimerRef.current = null;
    }, BURST_VISIBILITY_MS);
  }, [clearHideTimer]);

  React.useEffect(() => {
    if (previousTriggerRef.current === trigger) {
      return;
    }

    previousTriggerRef.current = trigger;
    if (reducedMotion) {
      clearHideTimer();
      setIsVisible(false);
      return;
    }
    if (trigger == null) {
      clearHideTimer();
      setIsVisible(false);
      return;
    }

    showBurst();
  }, [clearHideTimer, reducedMotion, showBurst, trigger]);

  React.useEffect(() => {
    if (!reducedMotion) {
      return;
    }
    clearHideTimer();
    setIsVisible(false);
  }, [clearHideTimer, reducedMotion]);

  React.useEffect(
    () => () => {
      clearHideTimer();
    },
    [clearHideTimer],
  );

  if (reducedMotion || !isVisible) {
    return null;
  }

  return (
    <View
      testID="filter-drill-burst"
      pointerEvents="none"
      accessible={shouldAnnounce}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={shouldAnnounce ? 'yes' : 'no-hide-descendants'}
      style={styles.overlay}
    >
      <LottieView
        key={playCount}
        testID="filter-drill-burst-player"
        source={source}
        autoPlay
        loop={false}
        style={{
          width: BURST_SIZE,
          height: BURST_SIZE,
          transform: [{ translateY: OPTICAL_CENTER_Y_OFFSET }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
