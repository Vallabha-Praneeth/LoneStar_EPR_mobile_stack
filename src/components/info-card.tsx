import * as React from 'react';

import { Card, Text, View } from '@/components/ui';

type InfoCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  compact?: boolean;
};

export function InfoCard({ icon, label, value, compact }: InfoCardProps) {
  return (
    <Card className={`rounded-xl ${compact ? 'p-3' : 'p-4'}`}>
      <View className="mb-1 flex-row items-center gap-2">
        {typeof icon === 'string'
          ? <Text className="text-sm">{icon}</Text>
          : <View className="size-4 items-center justify-center">{icon}</View>}
        <Text className="text-xs font-semibold tracking-widest text-slate-700 uppercase dark:text-slate-200">{label}</Text>
      </View>
      <Text className={`font-semibold ${compact ? 'text-sm' : ''}`}>{value}</Text>
    </Card>
  );
}
