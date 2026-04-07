import { useRouter } from 'expo-router';
import * as React from 'react';
import { TouchableOpacity } from 'react-native';

import { Settings } from '@/components/ui/icons';

export function AdminSettingsGearButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/admin/cost-types')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
      accessibilityLabel="Cost types settings"
    >
      <Settings color="#737373" width={20} height={20} />
    </TouchableOpacity>
  );
}
