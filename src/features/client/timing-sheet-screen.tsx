import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { EmptyStateWithAnimation } from '@/components/empty-state-with-animation';
import { CampaignMilestoneAnimation, emptyStatePresets, lottieAssets } from '@/components/motion';
import { Text, View } from '@/components/ui';
import { CheckCircle, ChevronLeft, Clock, LogOut } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchClientTimingShifts, hoursForShift } from '@/lib/api/client/timing';

function TimingShiftCard({
  title,
  dateLabel,
  startLabel,
  endLabel,
  firstPhotoLabel,
  hoursLabel,
}: {
  title: string;
  dateLabel: string;
  startLabel: string;
  endLabel: string;
  firstPhotoLabel: string;
  hoursLabel: string | null;
}) {
  const rows = [
    { label: 'Shift start', time: startLabel, done: startLabel !== '—' },
    { label: 'First photo', time: firstPhotoLabel, done: firstPhotoLabel !== '—' },
    { label: 'Shift end', time: endLabel, done: endLabel !== '—' },
  ];

  return (
    <View className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
      <Text className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</Text>
      <Text className="mb-4 text-sm text-neutral-500">{dateLabel}</Text>
      {rows.map(item => (
        <View key={item.label} className="flex-row items-center gap-3 border-b border-neutral-100 py-3 last:border-b-0 dark:border-neutral-700">
          <View
            className={`size-8 items-center justify-center rounded-full ${
              item.done ? 'bg-green-100 dark:bg-green-900/30' : 'bg-neutral-100 dark:bg-neutral-700'
            }`}
          >
            {item.done
              ? <CheckCircle color="#16a34a" width={16} height={16} />
              : <Clock color="#a3a3a3" width={16} height={16} />}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.label}</Text>
            <Text className="text-xs text-neutral-500">{item.time}</Text>
          </View>
        </View>
      ))}
      {hoursLabel && (
        <View className="mt-3 flex-row items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-700">
          <Text className="text-sm font-medium">Total hours</Text>
          <Text className="text-sm font-semibold text-primary">{hoursLabel}</Text>
        </View>
      )}
    </View>
  );
}

export function TimingSheetScreen() {
  const router = useRouter();
  const signOut = useAuthStore.use.signOut();
  const profile = useAuthStore.use.profile();
  const clientId = profile?.client_id ?? null;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['client-timing', clientId],
    queryFn: () => fetchClientTimingShifts(clientId!),
    enabled: !!clientId,
  });

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pt-14 pb-3 dark:border-neutral-700 dark:bg-neutral-800">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
            accessibilityLabel="Back"
          >
            <ChevronLeft color="#737373" width={22} height={22} />
          </TouchableOpacity>
          <Text className="text-base font-semibold">Timing sheet</Text>
        </View>
        <TouchableOpacity
          onPress={signOut}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
          accessibilityLabel="Sign out"
        >
          <LogOut color="#737373" width={18} height={18} />
        </TouchableOpacity>
      </View>

      {!clientId && (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-sm text-neutral-500">No client profile linked.</Text>
        </View>
      )}

      {clientId && isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      )}

      {clientId && !isLoading && rows.length === 0 && (
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          <EmptyStateWithAnimation
            source={lottieAssets.clientEmptyBox}
            message="No shift timing available yet."
            testID="client-timing-empty"
            {...emptyStatePresets.clientReportsInfo}
          />
        </ScrollView>
      )}

      {clientId && !isLoading && rows.length > 0 && (
        <ScrollView className="flex-1 px-4 pt-4 pb-8">
          <View className="mb-2 items-center">
            <CampaignMilestoneAnimation size={80} />
          </View>
          {rows.map(row => (
            <TimingShiftCard
              key={row.shiftId}
              title={row.campaign.title}
              dateLabel={format(new Date(`${row.campaign.campaign_date}T12:00:00`), 'MMMM d, yyyy')}
              startLabel={row.started_at ? format(new Date(row.started_at), 'h:mm a') : '—'}
              endLabel={row.ended_at ? format(new Date(row.ended_at), 'h:mm a') : '—'}
              firstPhotoLabel={
                row.first_photo_at ? format(new Date(row.first_photo_at), 'h:mm a') : '—'
              }
              hoursLabel={hoursForShift(row.started_at, row.ended_at)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
