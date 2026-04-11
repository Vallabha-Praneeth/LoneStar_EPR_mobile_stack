/* eslint-disable better-tailwindcss/no-unknown-classes */
import type { PressableProps } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import * as React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { tv } from 'tailwind-variants';

import { Text } from './text';

const button = tv({
  slots: {
    container:
      'my-2 flex flex-row items-center justify-center gap-2 rounded-md px-4 active:opacity-80',
    label: 'font-inter text-base font-semibold',
    indicator: 'h-6 text-white',
  },

  variants: {
    variant: {
      default: {
        container: 'bg-black dark:bg-white',
        label: 'text-white dark:text-black',
        indicator: 'text-white dark:text-black',
      },
      secondary: {
        container: 'bg-primary-600',
        label: 'text-white', // fixed: was text-secondary-600 (token does not exist)
        indicator: 'text-white',
      },
      outline: {
        container: 'border border-neutral-400',
        label: 'text-black dark:text-neutral-100',
        indicator: 'text-black dark:text-neutral-100',
      },
      destructive: {
        container: 'bg-red-600',
        label: 'text-white',
        indicator: 'text-white',
      },
      ghost: {
        container: 'bg-transparent',
        label: 'text-black underline dark:text-white',
        indicator: 'text-black dark:text-white',
      },
      link: {
        container: 'bg-transparent',
        label: 'text-black dark:text-white', // fixed: added dark:text-white
        indicator: 'text-black dark:text-white', // fixed: added dark:text-white
      },
    },
    size: {
      default: {
        container: 'h-11 px-4', // bumped h-10 (40px) → h-11 (44px), meets iOS min touch target
        label: 'text-base',
      },
      lg: {
        container: 'h-12 px-8',
        label: 'text-xl',
      },
      sm: {
        container: 'h-8 px-3', // visual height preserved; tap area expanded via hitSlop in render
        label: 'text-sm',
        indicator: 'h-2',
      },
      icon: { container: 'size-9' },
    },
    disabled: {
      true: {
        container: 'bg-neutral-300 dark:bg-neutral-300',
        label: 'text-neutral-600 dark:text-neutral-600',
        indicator: 'text-neutral-400 dark:text-neutral-400',
      },
    },
    fullWidth: {
      true: {
        container: '',
      },
      false: {
        container: 'self-center',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
    disabled: false,
    fullWidth: true,
    size: 'default',
  },
});

type ButtonVariants = VariantProps<typeof button>;
type Props = {
  label?: string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  textClassName?: string;
} & ButtonVariants
& Omit<PressableProps, 'disabled'>;

// Expands the tap area of sm buttons to ~44px tall without changing layout.
const SM_HIT_SLOP = { top: 6, bottom: 6, left: 0, right: 0 } as const;

export function Button({
  label: text,
  loading = false,
  leftIcon,
  rightIcon,
  variant = 'default',
  disabled = false,
  size = 'default',
  fullWidth = true,
  className = '',
  testID,
  textClassName = '',
  children,
  ...props
}: Props) {
  const styles = React.useMemo(
    () => button({ variant, disabled, size, fullWidth }),
    [variant, disabled, size, fullWidth],
  );

  const labelEl = text !== undefined
    ? (
        <Text
          testID={testID ? `${testID}-label` : undefined}
          className={styles.label({ className: textClassName })}
        >
          {text}
        </Text>
      )
    : null;

  function renderContent() {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          className={styles.indicator()}
          testID={testID ? `${testID}-activity-indicator` : undefined}
        />
      );
    }
    if (leftIcon !== undefined || rightIcon !== undefined) {
      return (
        <>
          {leftIcon ?? null}
          {labelEl}
          {rightIcon ?? null}
        </>
      );
    }
    return labelEl;
  }

  return (
    <Pressable
      disabled={disabled || loading}
      className={styles.container({ className })}
      hitSlop={size === 'sm' ? SM_HIT_SLOP : undefined}
      {...props}
      testID={testID}
    >
      {children || renderContent()}
    </Pressable>
  );
}
