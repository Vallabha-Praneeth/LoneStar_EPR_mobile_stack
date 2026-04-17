import type { RiveRef } from 'rive-react-native';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Rive, { Alignment, Direction, Fit, LoopMode } from 'rive-react-native';

/**
 * Rive-driven toggle for mobile admin. Mirrors web's `RiveToggle` —
 * same contract (src, checked, onCheckedChange) so screens look and
 * behave alike across platforms.
 *
 * Playback strategy (no asset-specific state-machine assumed):
 *   - On each checked change, play the first available animation
 *     forwards (on) or backwards (off) via LoopMode.OneShot.
 *   - Works out of the box with any single-timeline .riv, including
 *     the unlock-27122-51099 asset.
 */
type Props = {
  source: number; // require()'d .riv asset
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  width?: number;
  height?: number;
  animationName?: string;
  stateMachineName?: string;
  inputName?: string;
  testID?: string;
  accessibilityLabel?: string;
};

export function RiveToggle({
  source,
  checked,
  onCheckedChange,
  disabled = false,
  width = 72,
  height = 42,
  animationName = 'Timeline 1',
  stateMachineName,
  inputName,
  testID,
  accessibilityLabel,
}: Props) {
  const riveRef = React.useRef<RiveRef>(null);
  const prevChecked = React.useRef<boolean | null>(null);

  React.useEffect(() => {
    if (!riveRef.current)
      return;
    // Skip first mount — only animate on state change
    if (prevChecked.current === null) {
      prevChecked.current = checked;
      return;
    }
    if (prevChecked.current === checked)
      return;
    prevChecked.current = checked;

    // Prefer a state-machine boolean input when the caller knows it
    if (stateMachineName && inputName) {
      try {
        riveRef.current.setInputState(stateMachineName, inputName, checked);
        return;
      }
      catch {
        // fall through to animation playback
      }
    }
    riveRef.current.play(
      animationName,
      LoopMode.OneShot,
      checked ? Direction.Forwards : Direction.Backwards,
    );
  }, [checked, animationName, stateMachineName, inputName]);

  function handlePress() {
    if (disabled)
      return;
    onCheckedChange(!checked);
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.8}
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <View style={{ width, height }}>
        <Rive
          resourceName={undefined}
          url={undefined}
          ref={riveRef}
          source={source}
          stateMachineName={stateMachineName}
          fit={Fit.Contain}
          alignment={Alignment.Center}
          autoplay={!!stateMachineName}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    </TouchableOpacity>
  );
}
