import type { ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AnimatedSuccessBadge } from './animated-success-badge';

export type LottieViewSource = React.ComponentProps<typeof LottieView>['source'];

type Props = {
  source?: LottieViewSource;
  size?: number;
  loop?: boolean;
  autoPlay?: boolean;
  speed?: number;
  testID?: string;
  containerStyle?: ViewStyle;
  fallback?: React.ReactNode;
};

/**
 * Safe Lottie wrapper:
 * - Renders Lottie when a source is provided
 * - Falls back to a lightweight RN animation while assets are being wired
 */
export function LottieAnimation({
  source,
  size = 64,
  loop = true,
  autoPlay = true,
  speed = 1,
  testID,
  containerStyle,
  fallback,
}: Props) {
  if (!source) {
    return (
      <View
        testID={testID}
        style={[{ width: size, height: size }, containerStyle]}
        className="items-center justify-center"
      >
        {fallback ?? <ActivityIndicator size="small" color="#FF6C00" />}
      </View>
    );
  }

  return (
    <LottieView
      testID={testID}
      source={source}
      autoPlay={autoPlay}
      loop={loop}
      style={[{ width: size, height: size }, containerStyle]}
      renderMode="AUTOMATIC"
      speed={speed}
      resizeMode="contain"
    />
  );
}

type SuccessProps = {
  source?: LottieViewSource;
  size?: number;
};

export function UploadSuccessAnimation({ source, size = 80 }: SuccessProps) {
  return (
    <LottieAnimation
      source={source}
      size={size}
      loop={false}
      autoPlay
      speed={1}
      fallback={<AnimatedSuccessBadge size={size} />}
      testID="upload-success-animation"
    />
  );
}

export function UploadProgressAnimation({ source, size = 24 }: SuccessProps) {
  return (
    <LottieAnimation
      source={source}
      size={size}
      loop
      autoPlay
      speed={1.35}
      fallback={<ActivityIndicator size="small" color="#ffffff" />}
      testID="upload-progress-animation"
    />
  );
}
