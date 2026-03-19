import { useRouter } from 'expo-router';
import * as React from 'react';
import { TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/ui';

export function UploadSuccessScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-gray-50 p-6 dark:bg-gray-900">
      <View className="w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
        <View className="size-20 items-center justify-center rounded-full bg-green-100">
          <Text className="text-4xl">✅</Text>
        </View>

        <Text className="text-center text-xl font-bold">Photo Submitted!</Text>
        <Text className="text-center text-sm text-gray-500">
          Your photo is pending admin approval and will appear on the client
          gallery once approved.
        </Text>

        <View className="mt-2 w-full gap-3">
          <TouchableOpacity
            onPress={() => router.replace('/(app)/upload')}
            className="bg-primary h-12 items-center justify-center rounded-xl"
          >
            <Text className="font-semibold text-white">Upload Another</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="back-to-campaign-button"
            onPress={() => router.replace('/(app)/')}
            className="h-12 items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600"
          >
            <Text className="font-semibold text-gray-700 dark:text-gray-300">
              Back to Campaign
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
