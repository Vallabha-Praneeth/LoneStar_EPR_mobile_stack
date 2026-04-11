import type { DimensionValue, ViewStyle } from 'react-native';
import type { RiveRef } from 'rive-react-native';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Rive, { Alignment, Fit } from 'rive-react-native';

import { riveAssets } from './rive-assets';

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

// ─── Admin Animations ────────────────────────────────────────────

/** Dashboard hero — analytics screen header graphic */
export function DashboardHeroAnimation({ width = 280, height = 140 }: { width?: number; height?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/dashboard-hero.riv')}
      width={width}
      height={height}
      fit={Fit.Contain}
      autoplay
      testID="dashboard-hero-animation"
    />
  );
}

/** Campaign progress bar — campaign detail screen */
export function CampaignProgressAnimation({ width = 220, height = 60 }: { width?: number; height?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/campaign-progress.riv')}
      width={width}
      height={height}
      fit={Fit.Contain}
      autoplay
      testID="campaign-progress-animation"
    />
  );
}

/** Campaign milestone celebration — completed campaigns */
export function CampaignMilestoneAnimation({ size = 100 }: { size?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/campaign-milestone.riv')}
      width={size}
      height={size}
      fit={Fit.Contain}
      autoplay
      testID="campaign-milestone-animation"
    />
  );
}

/** Approve/unlock — photo approval area */
export function ApproveUnlockAnimation({ size = 48 }: { size?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/approve-unlock.riv')}
      width={size}
      height={size}
      fit={Fit.Contain}
      autoplay
      testID="approve-unlock-animation"
    />
  );
}

/** Campaign created — success state after creating a campaign */
export function CampaignCreatedAnimation({ size = 28 }: { size?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/campaign-created.riv')}
      width={size}
      height={size}
      fit={Fit.Contain}
      autoplay
      testID="campaign-created-animation"
    />
  );
}

/** Status icon — animated status indicator */
export function StatusIconAnimation({ size = 20 }: { size?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/status-icon.riv')}
      width={size}
      height={size}
      fit={Fit.Contain}
      autoplay
      testID="status-icon-animation"
    />
  );
}

/** Budget indicator — financial/cost visualisation */
export function BudgetIndicatorAnimation({ width = 200, height = 80 }: { width?: number; height?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/budget-indicator.riv')}
      width={width}
      height={height}
      fit={Fit.Contain}
      autoplay
      testID="budget-indicator-animation"
    />
  );
}

/** Icon set — decorative admin icon pack */
export function IconSetAnimation({ size = 36 }: { size?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/icon-set.riv')}
      width={size}
      height={size}
      fit={Fit.Contain}
      autoplay
      testID="icon-set-animation"
    />
  );
}

/** List pagination — animated list loading state */
export function ListPaginationAnimation({ size = 80 }: { size?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/list-pagination.riv')}
      width={size}
      height={size}
      fit={Fit.Contain}
      autoplay
      testID="list-pagination-animation"
    />
  );
}

// ─── Client Animations ───────────────────────────────────────────

/** Photo gallery hover — client landing photo section */
export function PhotoGalleryHoverAnimation({ width = 200, height = 120 }: { width?: number; height?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/photo-gallery-hover.riv')}
      width={width}
      height={height}
      fit={Fit.Contain}
      autoplay
      testID="photo-gallery-hover-animation"
    />
  );
}

/** Campaign fill / box-opening — transition animation when a client taps a campaign */
export function CampaignFillAnimation({ size = 180 }: { size?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/campaign-fill.riv')}
      width={size}
      height={size}
      fit={Fit.Contain}
      autoplay
      testID="campaign-fill-animation"
    />
  );
}

/** Welcome character — client landing hero greeting */
export function WelcomeCharacterAnimation({ size = 120 }: { size?: number }) {
  return (
    <RiveAnimation
      source={require('../../../assets/animations/welcome-character.riv')}
      width={size}
      height={size}
      fit={Fit.Contain}
      autoplay
      testID="welcome-character-animation"
    />
  );
}

// ─── Controls ────────────────────────────────────────────────────

/**
 * Rive toggle switch — plays Timeline 1 forwards (light → dark)
 * or backwards (dark → light) on each theme change.
 * Pass a riveRef to control playback from RiveThemeToggle.
 */
export function ToggleSwitchAnimation({
  width = 56,
  height = 32,
  riveRef,
}: {
  width?: number;
  height?: number;
  riveRef: React.RefObject<RiveRef | null>;
}) {
  return (
    <View style={{ width, height }} testID="toggle-switch-animation">
      <Rive
        resourceName={undefined}
        url={undefined}
        ref={riveRef}
        source={riveAssets.toggleSwitch}
        fit={Fit.Contain}
        alignment={Alignment.Center}
        autoplay={false}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}

type RiveButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  width?: number;
  height?: number;
  style?: ViewStyle;
  testID?: string;
};

/**
 * Rive button animation — fires the CLICK trigger on press and plays
 * the IDLE state machine. Drop-in animated replacement for flat buttons.
 */
export function RiveButton({
  onPress,
  disabled = false,
  width = 200,
  height = 56,
  style,
  testID,
}: RiveButtonProps) {
  const riveRef = React.useRef<RiveRef>(null);

  function handlePress() {
    if (disabled)
      return;
    riveRef.current?.fireState('State Machine 1', 'CLICK');
    onPress();
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={1}
      style={[{ width, height }, style]}
      testID={testID}
    >
      <Rive
        resourceName={undefined}
        url={undefined}
        ref={riveRef}
        source={riveAssets.buttonAnimation}
        stateMachineName="State Machine 1"
        fit={Fit.Contain}
        alignment={Alignment.Center}
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </TouchableOpacity>
  );
}
