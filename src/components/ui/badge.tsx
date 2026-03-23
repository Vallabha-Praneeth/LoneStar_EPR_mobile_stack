import type { ViewProps } from 'react-native';
import * as React from 'react';
import { Text, View } from 'react-native';
import { tv } from 'tailwind-variants';

const badge = tv({
  slots: {
    container: 'self-start rounded-full px-2 py-1',
    label: 'text-xs font-medium',
  },
  variants: {
    variant: {
      default: {
        container: 'bg-neutral-100 dark:bg-neutral-700',
        label: 'text-neutral-600 dark:text-neutral-300',
      },
      success: {
        container: 'bg-success-100 dark:bg-success-900',
        label: 'text-success-700 dark:text-success-200',
      },
      danger: {
        container: 'bg-danger-100 dark:bg-danger-900',
        label: 'text-danger-700 dark:text-danger-200',
      },
      warning: {
        container: 'bg-warning-100 dark:bg-warning-900',
        label: 'text-warning-700 dark:text-warning-200',
      },
    },
  },
  defaultVariants: { variant: 'default' },
});

type Variant = 'default' | 'success' | 'danger' | 'warning';

type BadgeProps = {
  label: string;
  variant?: Variant;
  className?: string;
  labelClassName?: string;
  testID?: string;
} & Omit<ViewProps, 'children'>;

export function Badge({
  label,
  variant = 'default',
  className,
  labelClassName,
  testID,
  ...props
}: BadgeProps) {
  const styles = React.useMemo(() => badge({ variant }), [variant]);

  return (
    <View
      className={styles.container({ className })}
      testID={testID}
      accessibilityRole="text"
      {...props}
    >
      <Text className={styles.label({ className: labelClassName })}>
        {label}
      </Text>
    </View>
  );
}
