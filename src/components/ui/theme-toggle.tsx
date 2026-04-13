import type { RiveRef } from 'rive-react-native';
import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import { Direction, LoopMode } from 'rive-react-native';
import { useUniwind } from 'uniwind';

import { ToggleSwitchAnimation } from '@/components/motion';
import { useSelectedTheme } from '@/lib/hooks/use-selected-theme';

/**
 * Animated Rive toggle that plays forwards (light → dark) or backwards
 * (dark → light). The animation starts at frame 0 (light state); on mount
 * in dark mode it snaps forward on the first render cycle so the visual
 * always matches the active theme after the first interaction.
 */
export function ThemeToggle() {
  const { setSelectedTheme } = useSelectedTheme();
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const riveRef = React.useRef<RiveRef>(null);
  const prevIsDark = React.useRef<boolean | null>(null);

  React.useEffect(() => {
    if (!riveRef.current)
      return;
    // Skip initial mount — only animate on theme change
    if (prevIsDark.current === null) {
      prevIsDark.current = isDark;
      return;
    }
    if (prevIsDark.current === isDark)
      return;
    prevIsDark.current = isDark;
    riveRef.current.play(
      'Timeline 1',
      LoopMode.OneShot,
      isDark ? Direction.Forwards : Direction.Backwards,
    );
  }, [isDark]);

  return (
    <TouchableOpacity
      onPress={() => setSelectedTheme(isDark ? 'light' : 'dark')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.8}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="button"
    >
      <ToggleSwitchAnimation width={72} height={42} riveRef={riveRef} />
    </TouchableOpacity>
  );
}
