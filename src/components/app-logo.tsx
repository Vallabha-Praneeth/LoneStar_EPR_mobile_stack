import * as React from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { Text, View } from '@/components/ui';

type AppLogoSize = 'sm' | 'md' | 'lg';

type AppLogoProps = {
  size?: AppLogoSize;
  showText?: boolean;
};

const SIZE_MAP: Record<AppLogoSize, { box: number; icon: number; text: string; radius: number }> = {
  sm: { box: 28, icon: 14, text: 'text-sm', radius: 10 },
  md: { box: 40, icon: 20, text: 'text-lg', radius: 14 },
  lg: { box: 64, icon: 32, text: 'text-2xl', radius: 22 },
};

function TruckIcon({ size, color = '#FF6C00' }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 3h15v13H1zM16 8h4l3 4v5h-7V8z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GlassRefractionLayer() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        <LinearGradient id="glass-base" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.28} />
          <Stop offset="50%" stopColor="#DDF2FF" stopOpacity={0.2} />
          <Stop offset="100%" stopColor="#F6E6FF" stopOpacity={0.18} />
        </LinearGradient>
        <LinearGradient id="top-light" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.42} />
          <Stop offset="55%" stopColor="#FFFFFF" stopOpacity={0.08} />
          <Stop offset="100%" stopColor="#0A1020" stopOpacity={0.12} />
        </LinearGradient>
      </Defs>

      <Rect x="0" y="0" width="100" height="100" fill="url(#glass-base)" />
      <Circle cx="24" cy="18" r="32" fill="#FFFFFF" opacity={0.2} />
      <Circle cx="88" cy="24" r="26" fill="#CFE9FF" opacity={0.18} />
      <Circle cx="76" cy="86" r="30" fill="#E5D4FF" opacity={0.14} />
      <Rect x="0" y="0" width="100" height="100" fill="url(#top-light)" />
    </Svg>
  );
}

export function AppLogo({ size = 'sm', showText = true }: AppLogoProps) {
  const s = SIZE_MAP[size];
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#FDE68A' : '#FF6C00';
  const continuousCurve = Platform.OS === 'ios'
    ? ({ borderCurve: 'continuous' } as const)
    : undefined;

  return (
    <View className="flex-row items-center gap-2">
      <View
        style={[
          styles.shadowWrap,
          {
            width: s.box,
            height: s.box,
            borderRadius: s.radius,
          },
          continuousCurve,
        ]}
      >
        <View
          style={[
            styles.glassBase,
            {
              borderRadius: s.radius,
            },
            continuousCurve,
          ]}
        >
          <GlassRefractionLayer />
          <View
            style={[
              styles.innerShadow,
              {
                borderRadius: s.radius,
              },
              continuousCurve,
            ]}
          />
          <View
            style={[
              styles.specularEdge,
              {
                borderRadius: s.radius,
              },
              continuousCurve,
            ]}
          />
          <View style={styles.iconWrap}>
            <TruckIcon size={s.icon} color={iconColor} />
          </View>
        </View>
      </View>
      {showText && (
        <Text className={`${s.text} font-bold tracking-tight`}>AdTruck</Text>
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    zIndex: 2,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
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
