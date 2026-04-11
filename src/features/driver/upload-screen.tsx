import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as React from 'react';
import {
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { LaunchArguments } from 'react-native-launch-arguments';
import { JuiceAnimation } from '@/components/motion';
import { Text, View } from '@/components/ui';
import { Camera, ChevronLeft, ImageIcon, Upload } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchDriverCampaign } from '@/lib/api/driver/campaign';
import { uploadPhoto } from '@/lib/api/driver/photos';
import { motionTokens } from '@/lib/motion/tokens';
import { supabase } from '@/lib/supabase';

const isE2E = LaunchArguments.value<{ isE2E?: string }>().isE2E === 'true';
const IS_IOS_SIMULATOR = Platform.OS === 'ios' && !Device.isDevice;

function PhotoPickerArea({ onCamera, onGallery }: { onCamera: () => void; onGallery: () => void }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={motionTokens.spring.gentle}
      className="items-center gap-4 rounded-xl border-2 border-dashed border-neutral-200 p-8 dark:border-neutral-600"
    >
      <View className="size-16 items-center justify-center">
        <MotiView
          from={{ scale: 1, opacity: 0.4 }}
          animate={{ scale: 2.0, opacity: 0 }}
          transition={{ type: 'timing', duration: 1400, loop: true }}
          className="absolute size-16 rounded-2xl bg-primary/20"
        />
        <MotiView
          from={{ scale: 1, opacity: 0.3 }}
          animate={{ scale: 1.55, opacity: 0 }}
          transition={{ type: 'timing', duration: 1400, loop: true, delay: 300 }}
          className="absolute size-16 rounded-2xl bg-primary/30"
        />
        <MotiView
          from={{ scale: 1 }}
          animate={{ scale: 1.12 }}
          transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: true }}
          className="size-16 items-center justify-center rounded-2xl bg-primary/10"
        >
          <Camera color="#1d4ed8" width={32} height={32} />
        </MotiView>
      </View>

      <MotiView
        from={{ opacity: 0, translateY: 4 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 120 }}
      >
        <Text className="text-center text-sm text-neutral-500">
          Take a photo or choose from gallery
        </Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 200 }}
        className="w-full flex-row gap-3"
      >
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
      </MotiView>
    </MotiView>
  );
}

function PhotoPreview({ uri, onClear }: { uri: string; onClear: () => void }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={motionTokens.spring.lively}
      className="relative overflow-hidden rounded-xl"
    >
      <ExpoImage
        source={{ uri }}
        style={{ width: '100%', aspectRatio: 4 / 3 }}
        contentFit="cover"
      />
      <TouchableOpacity
        onPress={onClear}
        activeOpacity={0.8}
        className="absolute top-3 right-3 flex-row items-center gap-1 rounded-lg bg-black/60 px-3 py-1.5"
      >
        <Camera color="#fff" width={12} height={12} />
        <Text className="text-xs font-medium text-white">Retake</Text>
      </TouchableOpacity>
    </MotiView>
  );
}

function useImagePicker() {
  const [imageUri, setImageUri] = React.useState<string | null>(null);

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
    if (!result.canceled)
      setImageUri(result.assets[0].uri);
  }

  async function handleGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showMessage({ message: 'Gallery permission denied', type: 'warning' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled)
      setImageUri(result.assets[0].uri);
  }

  return { imageUri, setImageUri, handleCamera, handleGallery };
}

export function UploadScreen() {
  const router = useRouter();
  const profile = useAuthStore.use.profile();
  const queryClient = useQueryClient();
  const [note, setNote] = React.useState('');
  const { imageUri, setImageUri, handleCamera, handleGallery } = useImagePicker();

  const { stopId, stopName } = useLocalSearchParams<{ stopId?: string; stopName?: string }>();

  const { data: campaign } = useQuery({
    queryKey: ['driver-campaign', profile?.id],
    queryFn: () => fetchDriverCampaign(profile!.id),
    enabled: !!profile?.id,
  });

  const uploadMutation = useMutation({
    mutationFn: () =>
      uploadPhoto({
        imageUri: imageUri!,
        campaignId: campaign!.id,
        driverId: profile!.id,
        note,
        stopId: stopId ?? undefined,
      }),
    onSuccess: (photoId: string) => {
      queryClient.invalidateQueries({ queryKey: ['driver-campaign'] });
      if (!isE2E) {
        supabase.functions
          .invoke('send-whatsapp-photo', {
            body: { campaignId: campaign!.id, photoId },
          })
          .catch(() => {
            showMessage({
              message: 'Photo uploaded, but WhatsApp notification failed.',
              type: 'warning',
            });
          });
      }
      router.replace({ pathname: '/(app)/upload-success', params: { uri: imageUri! } });
    },
    onError: (err: Error) =>
      showMessage({ message: err.message, type: 'danger' }),
  });

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: motionTokens.duration.base }}
        className="flex-row items-center gap-3 border-b border-neutral-200 bg-white px-4 pt-14 pb-3 dark:border-neutral-700 dark:bg-neutral-800"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color="#737373" width={20} height={20} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-semibold">Upload Photo</Text>
          {stopName
            ? <Text className="text-xs text-neutral-500" numberOfLines={1}>{`Stop: ${stopName}`}</Text>
            : null}
        </View>
      </MotiView>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...motionTokens.spring.gentle, delay: 80 }}
          className="gap-5 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"
        >
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
              style={{ fontSize: 16 }}
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
              ? <JuiceAnimation size={36} />
              : (
                  <View className="flex-row items-center gap-2">
                    <Upload color="#fff" width={18} height={18} />
                    <Text className="text-base font-semibold text-white">Submit Photo</Text>
                  </View>
                )}
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </View>
  );
}
