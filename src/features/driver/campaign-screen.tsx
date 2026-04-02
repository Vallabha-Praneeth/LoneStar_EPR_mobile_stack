import type { DriverCampaignData } from '@/lib/api/driver/campaign';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';

import { showMessage } from 'react-native-flash-message';
import { AppLogo } from '@/components/app-logo';
import { Text, View } from '@/components/ui';
import { Camera, Clipboard, Clock, LogOut, Play, StopCircle } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';
import {
  endShift,
  fetchDriverCampaign,
  startShift,
} from '@/lib/api/driver/campaign';

type CampaignPhoto = DriverCampaignData['campaign_photos'][number];

function getStatusColor(activeShift: boolean, status: string): string {
  if (activeShift) {
    return 'bg-green-100 text-green-700';
  }
  if (status === 'completed') {
    return 'bg-neutral-100 text-neutral-600';
  }
  return 'bg-blue-100 text-blue-700';
}

function CampaignHeader({ right }: { right: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pt-14 pb-3 dark:border-neutral-700 dark:bg-neutral-800">
      <AppLogo size="sm" showText />
      {right}
    </View>
  );
}

function EmptyCampaignState({ onSignOut }: { onSignOut: () => void }) {
  return (
    <View testID="driver-campaign-screen" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <CampaignHeader
        right={(
          <TouchableOpacity
            onPress={onSignOut}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
          >
            <LogOut color="#737373" width={18} height={18} />
          </TouchableOpacity>
        )}
      />
      <View className="flex-1 items-center justify-center p-6">
        <View className="w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-neutral-800">
          <View className="size-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-700">
            <Clipboard color="#a3a3a3" width={28} height={28} />
          </View>
          <Text className="text-center text-sm font-medium text-neutral-500">
            No active campaign assigned to you today.
          </Text>
        </View>
      </View>
    </View>
  );
}

function ShiftStatusBadge({ startedAt }: { startedAt: string }) {
  return (
    <View className="flex-row items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 dark:bg-green-900/30">
      <View className="size-2 rounded-full bg-green-500" />
      <Clock color="#16a34a" width={14} height={14} />
      <Text className="text-sm font-medium text-green-700 dark:text-green-400">
        Shift started at
        {' '}
        {format(new Date(startedAt), 'h:mm a')}
      </Text>
    </View>
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
                  <Play color="#fff" width={18} height={18} />
                  <Text className="text-base font-semibold text-white">Start Shift</Text>
                </>
              )}
        </View>
      </TouchableOpacity>
    );
  }
  return (
    <>
      <TouchableOpacity
        testID="upload-photo-button"
        onPress={onUploadPhoto}
        activeOpacity={0.8}
        className="h-14 items-center justify-center rounded-xl bg-primary"
      >
        <View className="flex-row items-center gap-2">
          <Camera color="#fff" width={18} height={18} />
          <Text className="text-base font-semibold text-white">Upload Photo</Text>
        </View>
      </TouchableOpacity>
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
    </>
  );
}

function RecentUploadsList({ photos }: { photos: CampaignPhoto[] }) {
  return (
    <View className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
      <Text className="mb-3 font-semibold">Recent Uploads</Text>
      {photos.map((photo, i) => (
        <View
          key={photo.id}
          className={`flex-row items-center justify-between py-2 ${
            i < photos.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''
          }`}
        >
          <View className="flex-row items-center gap-3">
            <View className="size-10 rounded-lg bg-neutral-100 dark:bg-neutral-700" />
            <Text className="text-sm text-neutral-500">
              {format(new Date(photo.submitted_at), 'h:mm a')}
            </Text>
          </View>
          <View className="rounded-full bg-green-100 px-2 py-1">
            <Text className="text-xs font-medium text-green-700">
              Uploaded
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function CampaignScreen() {
  const router = useRouter();
  const profile = useAuthStore.use.profile();
  const signOut = useAuthStore.use.signOut();
  const queryClient = useQueryClient();

  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['driver-campaign', profile?.id],
    queryFn: () => fetchDriverCampaign(profile!.id),
    enabled: !!profile?.id,
  });

  const startMutation = useMutation({
    mutationFn: () => startShift(campaign!.id, profile!.id),
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

  const activeShift = campaign?.driver_shifts.find(s => !s.ended_at);
  const recentPhotos = [...(campaign?.campaign_photos ?? [])]
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !campaign) {
    return <EmptyCampaignState onSignOut={signOut} />;
  }

  const statusColor = getStatusColor(!!activeShift, campaign.status);

  return (
    <View testID="driver-campaign-screen" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <CampaignHeader
        right={(
          <View className="flex-row items-center gap-2">
            <View className={`rounded-full px-2.5 py-1 ${statusColor}`}>
              <Text className="text-xs font-medium capitalize">
                {activeShift ? 'Active' : campaign.status}
              </Text>
            </View>
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
        <View className="gap-4 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
          <View>
            <Text className="text-lg font-semibold">{campaign.title}</Text>
            <Text className="mt-1 text-sm text-neutral-500">
              {format(new Date(`${campaign.campaign_date}T12:00:00`), 'MMMM d, yyyy')}
              {campaign.routes?.name ? ` • Route ${campaign.routes.name}` : ''}
            </Text>
          </View>
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
        </View>
        {recentPhotos.length > 0 ? <RecentUploadsList photos={recentPhotos} /> : null}
      </ScrollView>
    </View>
  );
}
