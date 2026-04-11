import type { DriverCampaignData, PastCampaignRow } from '@/lib/api/driver/campaign';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';

import { showMessage } from 'react-native-flash-message';
import { AppLogo } from '@/components/app-logo';
import { SpinnerAnimation, TruckAnimation } from '@/components/motion';
import { StatusBadge } from '@/components/status-badge';
import { Text, View } from '@/components/ui';
import { Camera, CaretDown, Clock, LogOut, Play, StopCircle } from '@/components/ui/icons';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/features/auth/use-auth-store';
import {
  endShift,
  fetchDriverCampaign,
  fetchDriverPastCampaigns,
  getPhotoSignedUrl,
  startShift,
} from '@/lib/api/driver/campaign';
import { motionTokens } from '@/lib/motion/tokens';

type CampaignPhoto = DriverCampaignData['campaign_photos'][number];

function PhotoThumbnail({ storagePath }: { storagePath: string | null }) {
  const { data: uri } = useQuery({
    queryKey: ['photo-thumb', storagePath],
    queryFn: () => getPhotoSignedUrl(storagePath!),
    enabled: !!storagePath,
    staleTime: 50 * 60 * 1000,
  });
  if (!uri)
    return <View className="size-10 rounded-lg bg-neutral-100 dark:bg-neutral-700" />;
  return <ExpoImage source={{ uri }} style={{ width: 40, height: 40, borderRadius: 8 }} contentFit="cover" />;
}

function CampaignHeader({ right }: { right: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motionTokens.duration.base }}
      className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pt-14 pb-3 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <AppLogo size="sm" showText />
      {right}
    </MotiView>
  );
}

function EmptyCampaignState({ onSignOut }: { onSignOut: () => void }) {
  return (
    <View testID="driver-campaign-screen" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <CampaignHeader
        right={(
          <View className="flex-row items-center gap-2">
            <ThemeToggle />
            <TouchableOpacity
              onPress={onSignOut}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
            >
              <LogOut color="#737373" width={18} height={18} />
            </TouchableOpacity>
          </View>
        )}
      />
      <View className="flex-1 items-center justify-center p-6">
        <MotiView
          from={{ opacity: 0, scale: 0.9, translateY: 16 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={motionTokens.spring.gentle}
          className="w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-neutral-800"
        >
          <TruckAnimation size={180} />
          <Text className="text-center text-sm font-medium text-neutral-500">
            No active campaign assigned to you today.
          </Text>
        </MotiView>
      </View>
    </View>
  );
}

function ShiftStatusBadge({ startedAt }: { startedAt: string }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={motionTokens.spring.lively}
      className="flex-row items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 dark:bg-green-900/30"
    >
      {/* pulsing live dot */}
      <View className="size-4 items-center justify-center">
        <MotiView
          from={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ type: 'timing', duration: 1100, loop: true }}
          className="absolute size-2 rounded-full bg-green-500"
        />
        <View className="size-2 rounded-full bg-green-500" />
      </View>
      <Clock color="#16a34a" width={14} height={14} />
      <Text className="text-sm font-medium text-green-700 dark:text-green-400">
        Shift started at
        {' '}
        {format(new Date(startedAt), 'h:mm a')}
      </Text>
    </MotiView>
  );
}

type ShiftActionsProps = {
  activeShift: boolean;
  onStartShift: () => void;
  isStartPending: boolean;
  onEndShift: () => void;
  isEndPending: boolean;
  onUploadPhoto: () => void;
};

function ShiftActions({
  activeShift,
  onStartShift,
  isStartPending,
  onEndShift,
  isEndPending,
  onUploadPhoto,
}: ShiftActionsProps) {
  if (!activeShift) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ ...motionTokens.spring.lively, delay: 120 }}
      >
        <TouchableOpacity
          testID="start-shift-button"
          onPress={onStartShift}
          disabled={isStartPending}
          activeOpacity={0.8}
          className="h-14 items-center justify-center rounded-xl bg-green-600 disabled:opacity-50"
        >
          <View className="flex-row items-center gap-2">
            {isStartPending
              ? <ActivityIndicator color="white" />
              : (
                  <>
                    <MotiView
                      from={{ rotate: '0deg' }}
                      animate={{ rotate: '0deg' }}
                      transition={{ type: 'timing', duration: motionTokens.duration.fast }}
                    >
                      <Play color="#fff" width={18} height={18} />
                    </MotiView>
                    <Text className="text-base font-semibold text-white">Start Shift</Text>
                  </>
                )}
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  }
  return (
    <>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ ...motionTokens.spring.lively, delay: 60 }}
      >
        <TouchableOpacity
          testID="upload-photo-button"
          onPress={onUploadPhoto}
          activeOpacity={0.8}
          className="h-14 items-center justify-center rounded-xl bg-primary"
        >
          <View className="flex-row items-center gap-2">
            <MotiView
              from={{ scale: 1 }}
              animate={{ scale: 1.15 }}
              transition={{ type: 'timing', duration: 800, loop: true, repeatReverse: true }}
            >
              <Camera color="#fff" width={18} height={18} />
            </MotiView>
            <Text className="text-base font-semibold text-white">Upload Photo</Text>
          </View>
        </TouchableOpacity>
      </MotiView>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ ...motionTokens.spring.lively, delay: 140 }}
      >
        <TouchableOpacity
          testID="end-shift-button"
          onPress={onEndShift}
          disabled={isEndPending}
          activeOpacity={0.8}
          className="h-14 items-center justify-center rounded-xl border border-red-200 bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20"
        >
          <View className="flex-row items-center gap-2">
            {isEndPending
              ? <ActivityIndicator color="#ef4444" />
              : (
                  <>
                    <StopCircle color="#ef4444" width={18} height={18} />
                    <Text className="text-base font-semibold text-red-500">End Shift</Text>
                  </>
                )}
          </View>
        </TouchableOpacity>
      </MotiView>
    </>
  );
}

function RecentUploadsList({ photos }: { photos: CampaignPhoto[] }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 200 }}
      className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <Text className="mb-3 font-semibold">Recent Uploads</Text>
      {photos.map((photo, i) => (
        <MotiView
          key={photo.id}
          from={{ opacity: 0, translateX: -12 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: motionTokens.duration.base, delay: i * 60 }}
          className={`flex-row items-center justify-between py-2 ${
            i < photos.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''
          }`}
        >
          <View className="flex-row items-center gap-3">
            <PhotoThumbnail storagePath={photo.storage_path} />
            <Text className="text-sm text-neutral-500">
              {format(new Date(photo.submitted_at), 'h:mm a')}
            </Text>
          </View>
          <View className="rounded-full bg-green-100 px-2 py-1 dark:bg-green-900/40">
            <Text className="text-xs font-medium text-green-700 dark:text-green-300">
              Uploaded
            </Text>
          </View>
        </MotiView>
      ))}
    </MotiView>
  );
}

function PastCampaignsAccordion({ driverId }: { driverId: string }) {
  const [open, setOpen] = React.useState(false);
  const { data: past = [], isLoading } = useQuery<PastCampaignRow[]>({
    queryKey: ['driver-past-campaigns', driverId],
    queryFn: () => fetchDriverPastCampaigns(driverId),
    enabled: open,
  });

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 280 }}
      className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
    >
      <TouchableOpacity
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.8}
        className="flex-row items-center justify-between p-5"
      >
        <Text className="font-semibold">Past Campaigns</Text>
        <MotiView
          animate={{ rotate: open ? '180deg' : '0deg' }}
          transition={{ type: 'timing', duration: motionTokens.duration.fast }}
        >
          <CaretDown color="#737373" width={18} height={18} />
        </MotiView>
      </TouchableOpacity>
      {open && (
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motionTokens.duration.fast }}
          className="border-t border-neutral-100 dark:border-neutral-700"
        >
          {isLoading && (
            <View className="items-center py-6">
              <ActivityIndicator />
            </View>
          )}
          {!isLoading && past.length === 0 && (
            <Text className="p-5 text-center text-sm text-neutral-500">No past campaigns.</Text>
          )}
          {past.map((c, i) => (
            <MotiView
              key={c.id}
              from={{ opacity: 0, translateX: -8 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: motionTokens.duration.fast, delay: i * 50 }}
              className={`flex-row items-center justify-between px-5 py-3 ${
                i < past.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''
              }`}
            >
              <View>
                <Text className="text-sm font-medium">{c.title}</Text>
                <Text className="text-xs text-neutral-500">
                  {format(new Date(`${c.campaign_date}T12:00:00`), 'MMM d, yyyy')}
                </Text>
              </View>
              <View className="rounded-full bg-neutral-100 px-2 py-1 dark:bg-neutral-700">
                <Text className="text-xs font-medium text-neutral-600 capitalize dark:text-neutral-400">
                  {c.status}
                </Text>
              </View>
            </MotiView>
          ))}
        </MotiView>
      )}
    </MotiView>
  );
}

function useShiftMutations(campaign: Awaited<ReturnType<typeof fetchDriverCampaign>>) {
  const signOut = useAuthStore.use.signOut();
  const queryClient = useQueryClient();
  const profileId = useAuthStore.use.profile()?.id;

  const startMutation = useMutation({
    mutationFn: () => startShift(campaign!.id, profileId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-campaign'] });
      showMessage({ message: 'Shift started', type: 'success' });
    },
    onError: (err: Error) => showMessage({ message: err.message, type: 'danger' }),
  });

  const endMutation = useMutation({
    mutationFn: () => {
      const active = campaign!.driver_shifts.find(s => !s.ended_at);
      return endShift(active!.id);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['driver-campaign'] });
      showMessage({ message: 'Shift ended. Good work!', type: 'success' });
      await signOut();
    },
    onError: (err: Error) => showMessage({ message: err.message, type: 'danger' }),
  });

  return { startMutation, endMutation };
}

export function CampaignScreen() {
  const router = useRouter();
  const profile = useAuthStore.use.profile();
  const signOut = useAuthStore.use.signOut();

  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['driver-campaign', profile?.id],
    queryFn: () => fetchDriverCampaign(profile!.id),
    enabled: !!profile?.id,
  });

  const { startMutation, endMutation } = useShiftMutations(campaign ?? null);

  const activeShift = campaign?.driver_shifts.find(s => !s.ended_at);
  const recentPhotos = [...(campaign?.campaign_photos ?? [])]
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <SpinnerAnimation size={64} />
      </View>
    );
  }

  if (error || !campaign) {
    return <EmptyCampaignState onSignOut={signOut} />;
  }

  return (
    <View testID="driver-campaign-screen" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <CampaignHeader
        right={(
          <View className="flex-row items-center gap-2">
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={motionTokens.spring.lively}
            >
              <StatusBadge status={activeShift ? 'active' : campaign.status} />
            </MotiView>
            <ThemeToggle />
            <TouchableOpacity
              onPress={signOut}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
            >
              <LogOut color="#737373" width={18} height={18} />
            </TouchableOpacity>
          </View>
        )}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...motionTokens.spring.gentle, delay: 60 }}
          className="gap-4 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"
        >
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 100 }}
          >
            <Text className="text-lg font-semibold">{campaign.title}</Text>
            <Text className="mt-1 text-sm text-neutral-500">
              {format(new Date(`${campaign.campaign_date}T12:00:00`), 'MMMM d, yyyy')}
              {campaign.routes?.name ? ` • Route ${campaign.routes.name}` : ''}
            </Text>
          </MotiView>
          {activeShift ? <ShiftStatusBadge startedAt={activeShift.started_at} /> : null}
          <View className="gap-3">
            <ShiftActions
              activeShift={!!activeShift}
              onStartShift={() => startMutation.mutate()}
              isStartPending={startMutation.isPending}
              onEndShift={() => endMutation.mutate()}
              isEndPending={endMutation.isPending}
              onUploadPhoto={() => router.push('/(app)/upload')}
            />
          </View>
        </MotiView>
        {recentPhotos.length > 0 ? <RecentUploadsList photos={recentPhotos} /> : null}
        {profile?.id ? <PastCampaignsAccordion driverId={profile.id} /> : null}
      </ScrollView>
    </View>
  );
}
