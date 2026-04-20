import * as React from 'react';
import { View } from 'react-native';
import Rive, { Alignment, Fit } from 'rive-react-native';

import { riveAssets } from '@/components/motion/rive-assets';

type BrandLogoProps = {
  size?: number;
  accessibilityLabel?: string;
};

export function BrandLogo({
  size = 24,
  accessibilityLabel = 'AdTruck',
}: BrandLogoProps) {
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      testID="brand-logo-rive"
      style={{ width: size, height: size }}
    >
      <Rive
        source={riveAssets.brandLogo}
        fit={Fit.Contain}
        alignment={Alignment.Center}
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}
