import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device';
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
import { Camera, ChevronLeft, ImageIcon, Upload } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchDriverCampaign } from '@/lib/api/driver/campaign';
import { uploadPhoto } from '@/lib/api/driver/photos';
import { supabase } from '@/lib/supabase';

// iOS simulator has no camera — fall back to gallery
const IS_IOS_SIMULATOR = Platform.OS === 'ios' && !Device.isDevice;

function PhotoPickerArea({ onCamera, onGallery }: { onCamera: () => void; onGallery: () => void }) {
  return (
    <View className="items-center gap-4 rounded-xl border-2 border-dashed border-neutral-200 p-8 dark:border-neutral-600">
      <View className="size-16 items-center justify-center rounded-2xl bg-primary/10">
        <Camera color="#1d4ed8" width={32} height={32} />
      </View>
      <Text className="text-center text-sm text-neutral-500">
        Take a photo or choose from gallery
      </Text>
      <View className="w-full flex-row gap-3">
        <TouchableOpacity
          onPress={onCamera}
          activeOpacity={0.8}
          className="h-14 flex-1 items-center justify-center rounded-xl bg-primary"
        >
          <View className="flex-row items-center gap-2">
            <Camera color="#fff" width={16} height={16} />
            <Text className="text-sm font-semibold text-white">Take Photo</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          testID="gallery-button"
          onPress={onGallery}
          activeOpacity={0.8}
          className="h-14 flex-1 items-center justify-center rounded-xl border border-neutral-300 dark:border-neutral-600"
        >
          <View className="flex-row items-center gap-2">
            <ImageIcon color="#525252" width={16} height={16} />
            <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Gallery</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PhotoPreview({ uri, onClear }: { uri: string; onClear: () => void }) {
  return (
    <View className="relative overflow-hidden rounded-xl">
      <Image
        source={{ uri }}
        className="w-full"
        style={{ aspectRatio: 4 / 3 }}
        resizeMode="cover"
      />
      <TouchableOpacity
        onPress={onClear}
        activeOpacity={0.8}
        className="absolute top-3 right-3 flex-row items-center gap-1 rounded-lg bg-black/60 px-3 py-1.5"
      >
        <Camera color="#fff" width={12} height={12} />
        <Text className="text-xs font-medium text-white">Retake</Text>
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
    onSuccess: (photoId: string) => {
      queryClient.invalidateQueries({ queryKey: ['driver-campaign'] });
      // Fire-and-forget WhatsApp notification to client
      supabase.functions
        .invoke('send-whatsapp-photo', {
          body: { campaignId: campaign!.id, photoId },
        })
        .catch(() => {}); // silent — don't block the driver flow
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
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <View className="flex-row items-center gap-3 border-b border-neutral-200 bg-white px-4 pt-14 pb-3 dark:border-neutral-700 dark:bg-neutral-800">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color="#737373" width={20} height={20} />
        </TouchableOpacity>
        <Text className="text-base font-semibold">Upload Photo</Text>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-5 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
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
              className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              placeholderTextColor="#a3a3a3"
            />
          </View>
          <TouchableOpacity
            testID="submit-photo-button"
            onPress={() => uploadMutation.mutate()}
            disabled={!imageUri || !campaign || uploadMutation.isPending}
            activeOpacity={0.8}
            className="h-14 items-center justify-center rounded-xl bg-primary disabled:opacity-50"
          >
            {uploadMutation.isPending
              ? <ActivityIndicator color="white" />
              : (
                  <View className="flex-row items-center gap-2">
                    <Upload color="#fff" width={18} height={18} />
                    <Text className="text-base font-semibold text-white">Submit Photo</Text>
                  </View>
                )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
