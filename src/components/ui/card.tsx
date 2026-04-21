import type { ViewProps } from 'react-native';
import * as React from 'react';
import { View } from 'react-native';
import { tv } from 'tailwind-variants';

const card = tv({
  base: 'rounded-2xl border border-neutral-200/85 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800',
});

type CardProps = ViewProps & {
  className?: string;
};

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View className={card({ className })} {...props}>
      {children}
    </View>
  );
}
