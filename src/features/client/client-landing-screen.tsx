import { TouchableOpacity } from 'react-native';

import { AppLogo } from '@/components/app-logo';
import { Text, View } from '@/components/ui';
import { Camera, FileText, LogOut } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';

export function ClientLandingScreen() {
  const signOut = useAuthStore.use.signOut();

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pt-14 pb-3 dark:border-neutral-700 dark:bg-neutral-800">
        <AppLogo size="sm" showText />
        <TouchableOpacity
          onPress={signOut}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
        >
          <LogOut color="#737373" width={18} height={18} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center p-6">
        <View className="w-full items-center gap-5 rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-neutral-800">
          <View className="size-14 items-center justify-center rounded-2xl bg-primary/10">
            <FileText color="#1d4ed8" width={28} height={28} />
          </View>
          <View className="items-center gap-1">
            <Text className="text-lg font-semibold">Campaign Reports</Text>
            <Text className="text-center text-sm/5 text-neutral-500">
              View your campaign photos, timing sheets, and PDF reports on the web portal.
            </Text>
          </View>
          <View className="flex-row items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 dark:bg-green-900/20">
            <Camera color="#16a34a" width={14} height={14} />
            <Text className="text-xs font-medium text-green-700 dark:text-green-400">
              Photo uploads are sent to your WhatsApp automatically
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
