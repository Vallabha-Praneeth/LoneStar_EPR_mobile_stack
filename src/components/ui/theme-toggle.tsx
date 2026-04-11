import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import { useUniwind } from 'uniwind';

import { Moon, Sun } from '@/components/ui/icons';
import { useSelectedTheme } from '@/lib/hooks/use-selected-theme';

/**
 * A small header button that toggles between light and dark mode.
 * Shows the sun icon in dark mode (tap → go light) and moon icon in
 * light mode (tap → go dark). 'system' resolves to the current
 * rendered theme so the icon always reflects what the user sees.
 */
export function ThemeToggle() {
  const { setSelectedTheme } = useSelectedTheme();
  const { theme } = useUniwind(); // resolved: 'light' | 'dark'

  const isDark = theme === 'dark';

  return (
    <TouchableOpacity
      onPress={() => setSelectedTheme(isDark ? 'light' : 'dark')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="button"
    >
      {isDark
        ? <Sun color="#e4e4e7" width={18} height={18} />
        : <Moon color="#737373" width={18} height={18} />}
    </TouchableOpacity>
  );
}
