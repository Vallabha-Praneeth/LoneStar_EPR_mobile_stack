import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import Rive, { Alignment, Fit } from 'rive-react-native';

import { riveAssets } from '@/components/motion/rive-assets';

type BrandLogoProps = {
  size?: number;
  accessibilityLabel?: string;
};

function GlassRefractionLayer() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        <LinearGradient id="brand-glass-base" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.28} />
          <Stop offset="45%" stopColor="#DDF2FF" stopOpacity={0.2} />
          <Stop offset="100%" stopColor="#F6E6FF" stopOpacity={0.16} />
        </LinearGradient>
        <LinearGradient id="brand-top-light" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.42} />
          <Stop offset="55%" stopColor="#FFFFFF" stopOpacity={0.08} />
          <Stop offset="100%" stopColor="#0A1020" stopOpacity={0.1} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill="url(#brand-glass-base)" />
      <Circle cx="24" cy="18" r="32" fill="#FFFFFF" opacity={0.2} />
      <Circle cx="88" cy="24" r="26" fill="#CFE9FF" opacity={0.16} />
      <Circle cx="76" cy="86" r="30" fill="#E5D4FF" opacity={0.12} />
      <Rect x="0" y="0" width="100" height="100" fill="url(#brand-top-light)" />
    </Svg>
  );
}

export function BrandLogo({
  size = 24,
  accessibilityLabel = 'LoneStar Fleet',
}: BrandLogoProps) {
  const radius = Math.max(10, Math.round(size * 0.38));
  const continuousCurve = Platform.OS === 'ios'
    ? ({ borderCurve: 'continuous' } as const)
    : undefined;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      testID="brand-logo-rive"
      style={[
        styles.shadowWrap,
        { width: size, height: size, borderRadius: radius },
        continuousCurve,
      ]}
    >
      <View
        style={[
          styles.glassBase,
          { borderRadius: radius },
          continuousCurve,
        ]}
      >
        <GlassRefractionLayer />
        <View
          style={[
            styles.innerShadow,
            { borderRadius: radius },
            continuousCurve,
          ]}
        />
        <View
          style={[
            styles.specularEdge,
            { borderRadius: radius },
            continuousCurve,
          ]}
        />
        <Rive
          source={riveAssets.brandLogo}
          fit={Fit.Contain}
          alignment={Alignment.Center}
          autoplay
          style={styles.rive}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  glassBase: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rive: {
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  specularEdge: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.55)',
    borderLeftColor: 'rgba(255,255,255,0.35)',
    borderRightColor: 'rgba(255,255,255,0.16)',
    borderBottomColor: 'rgba(5,10,24,0.2)',
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(8, 12, 22, 0.16)',
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
});
