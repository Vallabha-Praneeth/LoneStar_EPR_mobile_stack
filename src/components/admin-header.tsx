import { useRouter } from 'expo-router';
import * as React from 'react';
import { TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/ui';
import { ChevronLeft } from '@/components/ui/icons';

type AdminHeaderProps = {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
};

export function AdminHeader({ title, showBack = true, right }: AdminHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pt-14 pb-3 dark:border-neutral-700 dark:bg-neutral-800">
      <View className="flex-1 flex-row items-center gap-2">
        {showBack && (
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
          >
            <ChevronLeft color="#737373" width={20} height={20} />
          </TouchableOpacity>
        )}
        <Text className="flex-1 text-base font-semibold" numberOfLines={1}>{title}</Text>
      </View>
      {right}
    </View>
  );
}
