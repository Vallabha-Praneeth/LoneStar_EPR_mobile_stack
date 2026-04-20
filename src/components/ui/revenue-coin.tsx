import * as React from 'react';
import { View } from 'react-native';
import Rive, { Alignment, Fit } from 'rive-react-native';

import { riveAssets } from '@/components/motion/rive-assets';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

import { Text } from './text';

type RevenueCoinProps = {
  formattedValue: string;
  size?: number;
  accessibilityLabel?: string;
};

export function RevenueCoin({
  formattedValue,
  size = 48,
  accessibilityLabel,
}: RevenueCoinProps) {
  const reducedMotion = useReducedMotion();

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? `Revenue ${formattedValue}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
    >
      <View
        testID="revenue-coin-rive"
        style={{ width: size, height: size }}
      >
        <Rive
          source={riveAssets.skycoins}
          fit={Fit.Contain}
          alignment={Alignment.Center}
          autoplay={!reducedMotion}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      <Text className="text-xl font-semibold">
        {formattedValue}
      </Text>
    </View>
  );
}
