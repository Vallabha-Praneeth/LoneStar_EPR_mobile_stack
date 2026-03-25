import * as React from 'react';

import { Card, Text, View } from '@/components/ui';

type InfoCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

export function InfoCard({ icon, label, value }: InfoCardProps) {
  return (
    <Card className="rounded-xl p-4">
      <View className="mb-1 flex-row items-center gap-2">
        {typeof icon === 'string'
          ? <Text className="text-sm">{icon}</Text>
          : <View className="size-4 items-center justify-center">{icon}</View>}
        <Text className="text-xs text-neutral-500">{label}</Text>
      </View>
      <Text className="font-semibold">{value}</Text>
    </Card>
  );
}
