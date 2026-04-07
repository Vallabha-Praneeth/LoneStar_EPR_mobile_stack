import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as React from 'react';
import { TouchableOpacity } from 'react-native';

import { lottieAssets, UploadSuccessAnimation } from '@/components/motion';
import { Text, View } from '@/components/ui';
import { Camera, ChevronLeft } from '@/components/ui/icons';
import { motionTokens } from '@/lib/motion/tokens';

export function UploadSuccessScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-neutral-50 p-6 dark:bg-neutral-900">
      <View className="w-full items-center gap-5 rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-neutral-800">
        <UploadSuccessAnimation
          source={lottieAssets.uploadSuccess}
        />

        <MotiView
          from={{ opacity: 0, translateY: 6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motionTokens.duration.reveal }}
          className="items-center gap-1"
        >
          <Text className="text-center text-xl font-bold">Photo Submitted!</Text>
          <Text className="text-center text-sm/5 text-neutral-500">
            Your photo has been submitted successfully and is now visible to the
            client.
          </Text>
        </MotiView>
        <View className="mt-1 w-full gap-3">
          <TouchableOpacity
            onPress={() => router.replace('/(app)/upload')}
            activeOpacity={0.8}
            className="h-14 flex-row items-center justify-center gap-2 rounded-xl bg-primary"
          >
            <Camera color="#fff" width={18} height={18} />
            <Text className="font-semibold text-white">Upload Another</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="back-to-campaign-button"
            onPress={() => router.replace('/(app)/')}
            activeOpacity={0.8}
            className="h-14 flex-row items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-600"
          >
            <ChevronLeft color="#525252" width={16} height={16} />
            <Text className="font-semibold text-neutral-700 dark:text-neutral-300">
              Back to Campaign
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
