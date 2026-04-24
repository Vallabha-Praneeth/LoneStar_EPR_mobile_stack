import { View } from 'react-native';

import { Button, Text } from '@/components/ui';

type Props = {
  onOpenSettings: () => void;
};

export function BackgroundLocationBanner({ onOpenSettings }: Props) {
  return (
    <View
      accessibilityRole="alert"
      className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-900/30"
    >
      <Text className="text-sm font-semibold text-amber-900 dark:text-amber-100">
        Location tracking limited
      </Text>
      <Text className="mt-1 text-sm text-amber-800 dark:text-amber-200">
        Shift tracking runs only while the app is open. Enable background location in Settings so
        your dispatcher sees your position when the app is closed.
      </Text>
      <Button
        variant="outline"
        onPress={onOpenSettings}
        label="Enable in Settings"
        className="mt-2 self-start"
      />
    </View>
  );
}
