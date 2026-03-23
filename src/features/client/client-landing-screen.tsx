import { TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';

export function ClientLandingScreen() {
  const signOut = useAuthStore.use.signOut();

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 pt-14 pb-3 dark:border-gray-700 dark:bg-gray-800">
        <View className="flex-row items-center gap-2">
          <View className="size-7 items-center justify-center rounded-lg bg-primary">
            <Text className="text-xs font-bold text-white">AD</Text>
          </View>
          <Text className="text-base font-semibold">Client Portal</Text>
        </View>
        <TouchableOpacity onPress={signOut}>
          <Text className="text-sm text-gray-500">Sign out</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center p-6">
        <View className="w-full items-center rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <Text className="mb-2 text-lg font-semibold">Campaign Reports</Text>
          <Text className="text-center text-sm text-gray-500">
            View your campaign photos, timing sheets, and PDF reports on the web portal.
          </Text>
          <Text className="mt-4 text-center text-xs text-gray-400">
            Photo uploads are sent to your WhatsApp automatically.
          </Text>
        </View>
      </View>
    </View>
  );
}
