import type { DimensionValue, ViewStyle } from 'react-native';
import * as React from 'react';
import { View } from 'react-native';
import Rive, { Alignment, Fit } from 'rive-react-native';

type Props = {
  source: number; // require()'d .riv asset
  artboardName?: string;
  animationName?: string;
  stateMachineName?: string;
  fit?: Fit;
  alignment?: Alignment;
  width?: DimensionValue;
  height?: DimensionValue;
  style?: ViewStyle;
  autoplay?: boolean;
  testID?: string;
};

/**
 * Thin Rive wrapper that falls back to an empty View if the asset fails.
 * Always provide explicit width/height — Rive needs a bounded container.
 */
export function RiveAnimation({
  source,
  artboardName,
  animationName,
  stateMachineName,
  fit = Fit.Contain,
  alignment = Alignment.Center,
  width = 200,
  height = 200,
  style,
  autoplay = true,
  testID,
}: Props) {
  return (
    <View testID={testID} style={[{ width, height }, style]}>
      <Rive
        resourceName={undefined}
        url={undefined}
        ref={undefined}
        artboardName={artboardName}
        animationName={animationName}
        stateMachineName={stateMachineName}
        fit={fit}
        alignment={alignment}
        autoplay={autoplay}
        style={{ width: '100%', height: '100%' }}
        source={source}
      />
    </View>
  );
}

/** Truck that loops — used on empty campaign state */
export function TruckAnimation({ size = 180 }: { size?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/moving-truck.riv')}
      width={size}
      height={size * 0.6}
      fit={Fit.Contain}
      autoplay
      testID="truck-animation"
    />
  );
}

/** Animated login character */
export function LoginCharacterAnimation({ width = 260, height = 180 }: { width?: number; height?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/animated-login-character.riv')}
      width={width}
      height={height}
      fit={Fit.Contain}
      autoplay
      testID="login-character-animation"
    />
  );
}

/** Checkmark success — loop=false by default via stateMachine */
export function CheckmarkAnimation({ size = 80 }: { size?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/checkmark.riv')}
      width={size}
      height={size}
      fit={Fit.Contain}
      autoplay
      testID="checkmark-animation"
    />
  );
}

/** Spinner for loading states */
export function SpinnerAnimation({ size = 40 }: { size?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/spinner.riv')}
      width={size}
      height={size}
      fit={Fit.Contain}
      autoplay
      testID="spinner-animation"
    />
  );
}

/** Juice — used while uploading a photo */
export function JuiceAnimation({ size = 32 }: { size?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/juice.riv')}
      width={size}
      height={size}
      fit={Fit.Contain}
      autoplay
      testID="juice-animation"
    />
  );
}
