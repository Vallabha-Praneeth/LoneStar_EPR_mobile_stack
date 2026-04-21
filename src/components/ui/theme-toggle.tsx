import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import { useUniwind } from 'uniwind';
import { Moon, Sun } from '@/components/ui/icons';
import { uiPolishClasses } from '@/components/ui/polish-system';
import { useSelectedTheme } from '@/lib/hooks/use-selected-theme';

export function ThemeToggle() {
  const { setSelectedTheme } = useSelectedTheme();
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <TouchableOpacity
      onPress={() => setSelectedTheme(isDark ? 'light' : 'dark')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.8}
      className={uiPolishClasses.headerIconButton}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="button"
    >
      <Icon color="#737373" width={18} height={18} />
    </TouchableOpacity>
  );
}
