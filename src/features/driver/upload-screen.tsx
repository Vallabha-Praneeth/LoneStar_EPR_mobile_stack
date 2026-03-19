import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { Text, View } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchDriverCampaign } from '@/lib/api/driver/campaign';
import { uploadPhoto } from '@/lib/api/driver/photos';

// iOS simulator has no camera — fall back to gallery
const IS_IOS_SIMULATOR
  = Platform.OS === 'ios' && __DEV__ && !Platform.isPad;

function PhotoPickerArea({ onCamera, onGallery }: { onCamera: () => void; onGallery: () => void }) {
  return (
    <View className="items-center gap-4 rounded-xl border-2 border-dashed border-gray-200 p-8 dark:border-gray-600">
      <View className="size-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700">
        <Text className="text-3xl">📷</Text>
      </View>
      <Text className="text-center text-sm text-gray-500">
        Take a photo or choose from gallery
      </Text>
      <View className="w-full flex-row gap-3">
        <TouchableOpacity
          onPress={onCamera}
          className="bg-primary h-12 flex-1 items-center justify-center rounded-xl"
        >
          <Text className="text-sm font-semibold text-white">📷 Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="gallery-button"
          onPress={onGallery}
          className="h-12 flex-1 items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600"
        >
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            🖼 Gallery
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PhotoPreview({ uri, onClear }: { uri: string; onClear: () => void }) {
  return (
    <View className="relative">
      <Image
        source={{ uri }}
        className="w-full rounded-xl"
        style={{ aspectRatio: 4 / 3 }}
        resizeMode="cover"
      />
      <TouchableOpacity
        onPress={onClear}
        className="absolute top-2 right-2 rounded-lg bg-white/80 px-3 py-1"
      >
        <Text className="text-xs font-medium text-gray-600">Change</Text>
      </TouchableOpacity>
    </View>
  );
}

export function UploadScreen() {
  const router = useRouter();
  const profile = useAuthStore.use.profile();
  const queryClient = useQueryClient();

  const [note, setNote] = React.useState('');
  const [imageUri, setImageUri] = React.useState<string | null>(null);

  const { data: campaign } = useQuery({
    queryKey: ['driver-campaign', profile?.id],
    queryFn: () => fetchDriverCampaign(profile!.id),
    enabled: !!profile?.id,
  });

  const uploadMutation = useMutation({
    mutationFn: () =>
      uploadPhoto({ imageUri: imageUri!, campaignId: campaign!.id, driverId: profile!.id, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-campaign'] });
      router.replace('/(app)/upload-success');
    },
    onError: (err: Error) =>
      showMessage({ message: err.message, type: 'danger' }),
  });

  async function handleCamera() {
    if (IS_IOS_SIMULATOR) {
      showMessage({ message: 'Camera not available in iOS Simulator — using gallery', type: 'info' });
      return handleGallery();
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showMessage({ message: 'Camera permission denied', type: 'warning' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showMessage({ message: 'Gallery permission denied', type: 'warning' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-row items-center gap-3 border-b border-gray-200 bg-white px-4 pt-14 pb-3 dark:border-gray-700 dark:bg-gray-800">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-lg text-gray-500">‹</Text>
        </TouchableOpacity>
        <Text className="text-base font-semibold">Upload Photo</Text>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          {imageUri
            ? <PhotoPreview uri={imageUri} onClear={() => setImageUri(null)} />
            : <PhotoPickerArea onCamera={handleCamera} onGallery={handleGallery} />}
          <View className="gap-2">
            <Text className="text-sm font-medium">Note (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note about this photo..."
              multiline
              numberOfLines={2}
              style={{ fontSize: 16 }} // 16px prevents iOS auto-zoom
              className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <TouchableOpacity
            testID="submit-photo-button"
            onPress={() => uploadMutation.mutate()}
            disabled={!imageUri || !campaign || uploadMutation.isPending}
            className="bg-primary h-14 items-center justify-center rounded-xl disabled:opacity-40"
          >
            {uploadMutation.isPending
              ? <ActivityIndicator color="white" />
              : <Text className="text-base font-semibold text-white">↑ Submit Photo</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
