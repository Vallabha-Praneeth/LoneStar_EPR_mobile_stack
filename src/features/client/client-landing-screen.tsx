import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

import { AppLogo } from '@/components/app-logo';
import { EmptyStateWithAnimation } from '@/components/empty-state-with-animation';
import { emptyStatePresets, lottieAssets, PhotoGalleryHoverAnimation } from '@/components/motion';
import { Text, View } from '@/components/ui';
import { Camera, Clock, LogOut } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';

export function ClientLandingScreen() {
  const router = useRouter();
  const signOut = useAuthStore.use.signOut();

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pt-14 pb-3 dark:border-neutral-700 dark:bg-neutral-800">
        <AppLogo size="sm" showText />
        <View className="flex-row items-center gap-1">
          <TouchableOpacity
            onPress={() => router.push('/(app)/client/timing')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="mr-1 size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
            accessibilityLabel="Timing sheet"
          >
            <Clock color="#737373" width={18} height={18} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={signOut}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
          >
            <LogOut color="#737373" width={18} height={18} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 items-center justify-center p-6">
        <View className="w-full items-center gap-5 rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-neutral-800">
          <Text className="text-lg font-semibold">Campaign Reports</Text>
          <PhotoGalleryHoverAnimation width={200} height={110} />
          <EmptyStateWithAnimation
            source={lottieAssets.clientEmptyBox}
            message="View your campaign photos, timing sheets, and PDF reports on the web portal."
            testID="client-reports-info-animation"
            {...emptyStatePresets.clientReportsInfo}
          />
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
