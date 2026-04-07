/**
 * Simple horizontal bar chart built with react-native-svg.
 * No charting library needed — just proportional rectangles.
 */
import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';

export type BarDatum = {
  label: string;
  value: number;
  formattedValue: string;
};

type Props = {
  data: BarDatum[];
  barColor?: string;
};

const BAR_GAP = 8;

export function HorizontalBarChart({
  data,
  barColor = '#22c55e',
}: Props) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View>
      {data.map((item, i) => {
        const pct = Math.max((item.value / maxValue) * 100, 2);
        return (
          <View key={`${item.label}-${i}`} style={{ marginBottom: i < data.length - 1 ? BAR_GAP : 0 }}>
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-400" numberOfLines={1}>
                {item.label}
              </Text>
              <Text className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {item.formattedValue}
              </Text>
            </View>
            <View className="h-5 w-full overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-700">
              <View
                style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius: 6 }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
