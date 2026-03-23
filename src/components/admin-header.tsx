import { useRouter } from 'expo-router';
import * as React from 'react';
import { TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/ui';

type AdminHeaderProps = {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
};

export function AdminHeader({ title, showBack = true, right }: AdminHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 pt-14 pb-3 dark:border-gray-700 dark:bg-gray-800">
      <View className="flex-row items-center gap-3">
        {showBack && (
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-lg text-gray-500">‹</Text>
          </TouchableOpacity>
        )}
        <Text className="text-base font-semibold">{title}</Text>
      </View>
      {right}
    </View>
  );
}
