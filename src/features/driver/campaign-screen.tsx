import type { DriverCampaignData } from '@/lib/api/driver/campaign';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';

import { showMessage } from 'react-native-flash-message';
import { Text, View } from '@/components/ui';
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
    return 'bg-gray-100 text-gray-600';
  }
  return 'bg-blue-100 text-blue-700';
}

function CampaignHeader({ right }: { right: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 pt-14 pb-3 dark:border-gray-700 dark:bg-gray-800">
      <View className="flex-row items-center gap-2">
        <View className="size-7 items-center justify-center rounded-lg bg-primary">
          <Text className="text-xs font-bold text-white">AD</Text>
        </View>
        <Text className="text-base font-semibold">My Campaign</Text>
      </View>
      {right}
    </View>
  );
}

function EmptyCampaignState({ onSignOut }: { onSignOut: () => void }) {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <CampaignHeader
        right={(
          <TouchableOpacity onPress={onSignOut}>
            <Text className="text-sm text-gray-500">Sign out</Text>
          </TouchableOpacity>
        )}
      />
      <View className="flex-1 items-center justify-center p-6">
        <View className="w-full items-center rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <Text className="text-center text-sm text-gray-500">
            No active campaign assigned to you today.
          </Text>
        </View>
      </View>
    </View>
  );
}

function ShiftStatusBadge({ startedAt }: { startedAt: string }) {
  return (
    <View className="flex-row items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
      <Text className="text-sm text-green-700">
        ⏱ Shift started at
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
        className="h-14 items-center justify-center rounded-xl bg-green-500 disabled:opacity-50"
      >
        <Text className="text-base font-semibold text-white">
          {isStartPending ? 'Starting...' : '▶ Start Shift'}
        </Text>
      </TouchableOpacity>
    );
  }
  return (
    <>
      <TouchableOpacity
        testID="upload-photo-button"
        onPress={onUploadPhoto}
        className="h-14 items-center justify-center rounded-xl bg-primary"
      >
        <Text className="text-base font-semibold text-white">📷 Upload Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="end-shift-button"
        onPress={onEndShift}
        disabled={isEndPending}
        className="h-14 items-center justify-center rounded-xl border border-red-300 disabled:opacity-50"
      >
        <Text className="text-base font-semibold text-red-500">
          {isEndPending ? 'Ending...' : '⏹ End Shift'}
        </Text>
      </TouchableOpacity>
    </>
  );
}

function RecentUploadsList({ photos }: { photos: CampaignPhoto[] }) {
  return (
    <View className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <Text className="mb-3 font-semibold">Recent Uploads</Text>
      {photos.map((photo, i) => (
        <View
          key={photo.id}
          className={`flex-row items-center justify-between py-2 ${
            i < photos.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
          }`}
        >
          <View className="flex-row items-center gap-3">
            <View className="size-10 rounded-lg bg-gray-100 dark:bg-gray-700" />
            <Text className="text-sm text-gray-500">
              {format(new Date(photo.submitted_at), 'h:mm a')}
            </Text>
          </View>
          <View
            className={`rounded-full px-2 py-1 ${
              photo.status === 'approved'
                ? 'bg-green-100'
                : photo.status === 'rejected'
                  ? 'bg-red-100'
                  : 'bg-yellow-100'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                photo.status === 'approved'
                  ? 'text-green-700'
                  : photo.status === 'rejected'
                    ? 'text-red-700'
                    : 'text-yellow-700'
              }`}
            >
              {photo.status}
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
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <CampaignHeader
        right={(
          <View className="flex-row items-center gap-2">
            <View className={`rounded-full px-2 py-1 ${statusColor}`}>
              <Text className="text-xs font-medium">
                {activeShift ? 'Active' : campaign.status}
              </Text>
            </View>
            <TouchableOpacity onPress={signOut}>
              <Text className="text-sm text-gray-500">Sign out</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <View>
            <Text className="text-lg font-semibold">{campaign.title}</Text>
            <Text className="mt-1 text-sm text-gray-500">
              {format(new Date(`${campaign.campaign_date}T12:00:00`), 'MMMM d, yyyy')}
              {campaign.route_code ? ` • Route ${campaign.route_code}` : ''}
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
