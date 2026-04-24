import LottieView from 'lottie-react-native';
import * as React from 'react';
import { View } from 'react-native';

import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

import { lottieAssets } from './lottie-assets';

const VISIBLE_MS = 2000;

type ExportSuccessBurstProps = {
  visible: boolean;
  onHide: () => void;
};

export function ExportSuccessBurst({ visible, onHide }: ExportSuccessBurstProps) {
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    const timeoutId = setTimeout(onHide, VISIBLE_MS);
    return () => clearTimeout(timeoutId);
  }, [onHide, visible]);

  if (!visible || reducedMotion) {
    return null;
  }

  return (
    <View
      testID="export-success-burst"
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityLabel="Report exported"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
      }}
    >
      <LottieView
        source={lottieAssets.businessDeal}
        autoPlay
        loop={false}
        style={{ width: 220, height: 220 }}
      />
    </View>
  );
}
