import { useRouter } from 'expo-router';
import * as React from 'react';
import { TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/ui';
import { CheckCircle } from '@/components/ui/icons';

export function UploadSuccessScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-neutral-50 p-6 dark:bg-neutral-900">
      <View className="w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-neutral-800">
        <View className="size-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle color="#16a34a" width={40} height={40} />
        </View>

        <Text className="text-center text-xl font-bold">Photo Submitted!</Text>
        <Text className="text-center text-sm text-neutral-500">
          Your photo is pending admin approval and will appear on the client
          gallery once approved.
        </Text>

        <View className="mt-2 w-full gap-3">
          <TouchableOpacity
            onPress={() => router.replace('/(app)/upload')}
            className="h-12 items-center justify-center rounded-xl bg-primary"
          >
            <Text className="font-semibold text-white">Upload Another</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="back-to-campaign-button"
            onPress={() => router.replace('/(app)/')}
            className="h-12 items-center justify-center rounded-xl border border-neutral-300 dark:border-neutral-600"
          >
            <Text className="font-semibold text-neutral-700 dark:text-neutral-300">
              Back to Campaign
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
