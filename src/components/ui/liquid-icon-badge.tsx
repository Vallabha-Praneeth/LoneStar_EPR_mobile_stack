import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type LiquidIconBadgeProps = {
  children: React.ReactNode;
  size?: number;
  radius?: number;
};

function GlassRefractionLayer() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        <LinearGradient id="liquid-icon-glass-base" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.3} />
          <Stop offset="50%" stopColor="#E3F1FF" stopOpacity={0.22} />
          <Stop offset="100%" stopColor="#F6E6FF" stopOpacity={0.18} />
        </LinearGradient>
        <LinearGradient id="liquid-icon-top-light" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.46} />
          <Stop offset="60%" stopColor="#FFFFFF" stopOpacity={0.08} />
          <Stop offset="100%" stopColor="#0A1020" stopOpacity={0.12} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill="url(#liquid-icon-glass-base)" />
      <Circle cx="24" cy="18" r="30" fill="#FFFFFF" opacity={0.2} />
      <Circle cx="84" cy="24" r="24" fill="#CFE9FF" opacity={0.16} />
      <Rect x="0" y="0" width="100" height="100" fill="url(#liquid-icon-top-light)" />
    </Svg>
  );
}

export function LiquidIconBadge({
  children,
  size = 28,
  radius = 10,
}: LiquidIconBadgeProps) {
  const continuousCurve = Platform.OS === 'ios'
    ? ({ borderCurve: 'continuous' } as const)
    : undefined;

  return (
    <View
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
        <View style={[styles.innerShadow, { borderRadius: radius }, continuousCurve]} />
        <View style={[styles.specularEdge, { borderRadius: radius }, continuousCurve]} />
        <View style={styles.iconWrap}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  glassBase: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    zIndex: 2,
  },
  specularEdge: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.58)',
    borderLeftColor: 'rgba(255,255,255,0.34)',
    borderRightColor: 'rgba(255,255,255,0.14)',
    borderBottomColor: 'rgba(5,10,24,0.18)',
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(8, 12, 22, 0.14)',
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
});
