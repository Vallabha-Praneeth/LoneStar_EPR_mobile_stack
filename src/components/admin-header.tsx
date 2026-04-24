import { useRouter } from 'expo-router';
import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo, RiveBackButton, Text, View } from '@/components/ui';
import { uiPolishClasses } from '@/components/ui/polish-system';

type AdminHeaderProps = {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
};

export function AdminHeader({ title, showBack = true, right }: AdminHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className={`${uiPolishClasses.headerShell} flex-row items-center justify-between`} style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-1 flex-row items-center gap-2">
        {showBack && (
          <RiveBackButton
            testID="back-button"
            onPress={() => router.back()}
          />
        )}
        <BrandLogo />
        <Text className="flex-1 text-base font-semibold" numberOfLines={1}>{title}</Text>
      </View>
      {right}
    </View>
  );
}
