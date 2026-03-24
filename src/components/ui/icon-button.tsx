import type { PressableProps } from 'react-native';
import * as React from 'react';
import { useUniwind } from 'uniwind';

import { Button } from './button';

// ---------------------------------------------------------------------------
// Icon color map — mirrors Button's label/indicator text colors per variant.
// Values are sourced directly from the @theme tokens in global.css.
// ---------------------------------------------------------------------------
const VARIANT_ICON_COLORS = {
  default: { light: '#ffffff', dark: '#000000' }, // text-white / dark:text-black
  secondary: { light: '#ffffff', dark: '#ffffff' }, // text-white (no dark override)
  outline: { light: '#000000', dark: '#F5F5F5' }, // text-black / dark:text-neutral-100
  destructive: { light: '#ffffff', dark: '#ffffff' }, // text-white (no dark override)
  ghost: { light: '#000000', dark: '#ffffff' }, // text-black / dark:text-white
  link: { light: '#000000', dark: '#ffffff' }, // text-black / dark:text-white
} as const;

// neutral-600 (#525252) — matches Button's disabled label/indicator color, both modes.
const DISABLED_ICON_COLOR = '#525252';

// Expands the tap area from size-9 (36px) to ~44×44px without changing visual size.
const ICON_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 } as const;

type Variant = keyof typeof VARIANT_ICON_COLORS;

type IconButtonProps = {
  /**
   * The icon element to render. Typically an SVG from @/components/ui/icons.
   * Its `color` prop is automatically set from the active variant + color scheme.
   */
  icon: React.ReactNode;
  /**
   * Overrides the auto-derived icon color. Use only when the variant color is
   * not appropriate (e.g. a custom branded icon button).
   */
  iconColor?: string;
  loading?: boolean;
  /**
   * Required for screen readers — describes the button action (e.g. "Open menu").
   * Icon-only buttons have no visible label, so this is the only accessible name.
   */
  accessibilityLabel: string;
  className?: string;
  testID?: string;
} & Pick<React.ComponentProps<typeof Button>, 'variant' | 'disabled'>
& Omit<PressableProps, 'disabled' | 'children' | 'accessibilityLabel'>;

export function IconButton({
  icon,
  iconColor,
  loading = false,
  variant = 'default',
  disabled = false,
  accessibilityLabel,
  className = '',
  testID,
  ...props
}: IconButtonProps) {
  const { theme } = useUniwind();
  const scheme: 'light' | 'dark' = theme === 'dark' ? 'dark' : 'light';

  const derivedColor
    = iconColor !== undefined
      ? iconColor
      : disabled
        ? DISABLED_ICON_COLOR
        : VARIANT_ICON_COLORS[(variant ?? 'default') as Variant][scheme];

  // Inject `color` into the icon if it is a valid React element.
  // All icons in this project accept `color` via SvgProps — this is the established pattern.
  const coloredIcon = React.useMemo(
    () =>
      React.isValidElement<{ color?: string }>(icon)
        ? React.cloneElement(icon, { color: derivedColor })
        : icon,
    [icon, derivedColor],
  );

  return (
    <Button
      size="icon"
      variant={variant}
      disabled={disabled}
      loading={loading}
      fullWidth={false}
      className={`my-0 rounded-full px-0 ${className}`.trim()}
      testID={testID}
      hitSlop={ICON_HIT_SLOP}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      {...props}
    >
      {/*
       * null is falsy — when loading, Button falls through to its own render
       * path and shows the ActivityIndicator (correctly colored by its variant's
       * indicator slot class). The Pressable is also disabled via loading=true.
       */}
      {loading ? null : coloredIcon}
    </Button>
  );
}
