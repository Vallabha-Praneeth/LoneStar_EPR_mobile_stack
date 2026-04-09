import type { DriverDetailRow, DriverShiftHistoryRow } from '@/lib/api/admin/drivers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { AdminHeader } from '@/components/admin-header';
import { EmptyStateWithAnimation } from '@/components/empty-state-with-animation';
import { emptyStatePresets, lottieAssets } from '@/components/motion';
import { Button, Text, View } from '@/components/ui';
import {
  fetchDriverByProfileId,
  fetchDriverShiftHistory,
  fetchProfileSnippet,
  upsertDriverRecord,
} from '@/lib/api/admin/drivers';
import { formatDurationMins } from '@/lib/api/client/timing';

function shiftDurationMins(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

function computeShiftTotals(shifts: DriverShiftHistoryRow[], baseDailyWage: number | null): { totalMins: number; totalEarnings: number } {
  let totalMins = 0;
  const uniqueCampaigns = new Set<string>();
  for (const s of shifts) {
    if (s.ended_at)
      totalMins += shiftDurationMins(s.started_at, s.ended_at);
    const cid = s.campaigns?.id;
    if (cid)
      uniqueCampaigns.add(cid);
  }
  const totalEarnings = baseDailyWage != null ? baseDailyWage * uniqueCampaigns.size : 0;
  return { totalMins, totalEarnings };
}

function ShiftHistoryCard({ row }: { row: DriverShiftHistoryRow }) {
  const c = row.campaigns;
  const title = c?.title ?? 'Campaign';
  const dateStr = c?.campaign_date ? format(new Date(`${c.campaign_date}T12:00:00`), 'MMM d, yyyy') : '';
  const hours
    = row.ended_at ? formatDurationMins(shiftDurationMins(row.started_at, row.ended_at)) : 'In progress';
  // Wage display removed — now tracked per-driver on drivers table, not per-campaign

  return (
    <View className="mb-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <Text className="font-semibold" numberOfLines={2}>{title}</Text>
      <Text className="text-xs text-neutral-500">{dateStr}</Text>
      <View className="mt-2 gap-1">
        <Text className="text-sm">
          {format(new Date(row.started_at), 'h:mm a')}
          {' '}
          →
          {row.ended_at ? format(new Date(row.ended_at), 'h:mm a') : ' …'}
        </Text>
        <Text className="text-xs text-neutral-500">
          Hours:
          {hours}
        </Text>
      </View>
    </View>
  );
}

function TotalsSummary({
  totalMins,
  totalEarnings,
}: {
  totalMins: number;
  totalEarnings: number;
}) {
  return (
    <View className="mb-4 flex-row gap-3">
      <View className="flex-1 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
        <Text className="text-xs text-neutral-500">Total hours (completed)</Text>
        <Text className="mt-1 text-lg font-bold">{formatDurationMins(totalMins)}</Text>
      </View>
      <View className="flex-1 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
        <Text className="text-xs text-neutral-500">Total earnings</Text>
        <Text className="mt-1 text-lg font-bold">
          $
          {totalEarnings.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

type DriverFormInitial = {
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  baseDailyWage: string;
  city: string;
};

function driverFormInitial(driver: DriverDetailRow | null | undefined): DriverFormInitial {
  if (!driver) {
    return {
      licenseNumber: '',
      licenseType: '',
      licenseExpiry: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      baseDailyWage: '',
      city: '',
    };
  }
  return {
    licenseNumber: driver.license_number ?? '',
    licenseType: driver.license_type ?? '',
    licenseExpiry: driver.license_expiry ?? '',
    emergencyContactName: driver.emergency_contact_name ?? '',
    emergencyContactPhone: driver.emergency_contact_phone ?? '',
    baseDailyWage: driver.base_daily_wage?.toString() ?? '',
    city: driver.city ?? '',
  };
}

function DriverLicenseInputs({
  licenseNumber,
  licenseType,
  licenseExpiry,
  setLicenseNumber,
  setLicenseType,
  setLicenseExpiry,
}: {
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  setLicenseNumber: (t: string) => void;
  setLicenseType: (t: string) => void;
  setLicenseExpiry: (t: string) => void;
}) {
  return (
    <>
      <Text className="mt-6 mb-2 font-semibold">License</Text>
      <View className="mb-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
        <TextInput
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          placeholder="License number"
          placeholderTextColor="#a3a3a3"
          className="text-base text-neutral-900 dark:text-neutral-100"
        />
      </View>
      <View className="mb-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
        <TextInput
          value={licenseType}
          onChangeText={setLicenseType}
          placeholder="License type"
          placeholderTextColor="#a3a3a3"
          className="text-base text-neutral-900 dark:text-neutral-100"
        />
      </View>
      <View className="mb-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
        <TextInput
          value={licenseExpiry}
          onChangeText={setLicenseExpiry}
          placeholder="Expiry (YYYY-MM-DD)"
          placeholderTextColor="#a3a3a3"
          className="text-base text-neutral-900 dark:text-neutral-100"
        />
      </View>
    </>
  );
}

function DriverEmergencyInputs({
  emergencyContactName,
  emergencyContactPhone,
  setEmergencyContactName,
  setEmergencyContactPhone,
}: {
  emergencyContactName: string;
  emergencyContactPhone: string;
  setEmergencyContactName: (t: string) => void;
  setEmergencyContactPhone: (t: string) => void;
}) {
  return (
    <>
      <Text className="mb-2 font-semibold">Emergency contact</Text>
      <View className="mb-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
        <TextInput
          value={emergencyContactName}
          onChangeText={setEmergencyContactName}
          placeholder="Name"
          placeholderTextColor="#a3a3a3"
          className="text-base text-neutral-900 dark:text-neutral-100"
        />
      </View>
      <View className="mb-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
        <TextInput
          value={emergencyContactPhone}
          onChangeText={setEmergencyContactPhone}
          placeholder="Phone"
          placeholderTextColor="#a3a3a3"
          className="text-base text-neutral-900 dark:text-neutral-100"
        />
      </View>
    </>
  );
}

function DriverCompInputs({
  baseDailyWage,
  city,
  setBaseDailyWage,
  setCity,
}: {
  baseDailyWage: string;
  city: string;
  setBaseDailyWage: (t: string) => void;
  setCity: (t: string) => void;
}) {
  return (
    <>
      <Text className="mb-2 font-semibold">Compensation & location</Text>
      <View className="mb-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
        <TextInput
          value={baseDailyWage}
          onChangeText={setBaseDailyWage}
          placeholder="Base daily wage"
          keyboardType="decimal-pad"
          placeholderTextColor="#a3a3a3"
          className="text-base text-neutral-900 dark:text-neutral-100"
        />
      </View>
      <View className="mb-4 rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="City"
          placeholderTextColor="#a3a3a3"
          className="text-base text-neutral-900 dark:text-neutral-100"
        />
      </View>
    </>
  );
}

function DriverProfileForm({
  profileId,
  driverRowId,
  initial,
}: {
  profileId: string;
  driverRowId: string | null;
  initial: DriverFormInitial;
}) {
  const queryClient = useQueryClient();
  const [licenseNumber, setLicenseNumber] = React.useState(initial.licenseNumber);
  const [licenseType, setLicenseType] = React.useState(initial.licenseType);
  const [licenseExpiry, setLicenseExpiry] = React.useState(initial.licenseExpiry);
  const [emergencyContactName, setEmergencyContactName] = React.useState(initial.emergencyContactName);
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState(initial.emergencyContactPhone);
  const [baseDailyWage, setBaseDailyWage] = React.useState(initial.baseDailyWage);
  const [city, setCity] = React.useState(initial.city);

  const mutation = useMutation({
    mutationFn: async () => {
      const wageNum = Number.parseFloat(baseDailyWage);
      const fields = {
        license_number: licenseNumber.trim() || null,
        license_type: licenseType.trim() || null,
        license_expiry: licenseExpiry || null,
        emergency_contact_name: emergencyContactName.trim() || null,
        emergency_contact_phone: emergencyContactPhone.trim() || null,
        base_daily_wage: !Number.isNaN(wageNum) && wageNum >= 0 ? wageNum : null,
        city: city.trim() || null,
      };
      await upsertDriverRecord(profileId, driverRowId, fields);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-detail', profileId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showMessage({ message: 'Driver details saved', type: 'success' });
    },
    onError: (err: Error) => showMessage({ message: err.message, type: 'danger' }),
  });

  return (
    <>
      <DriverLicenseInputs
        licenseNumber={licenseNumber}
        licenseType={licenseType}
        licenseExpiry={licenseExpiry}
        setLicenseNumber={setLicenseNumber}
        setLicenseType={setLicenseType}
        setLicenseExpiry={setLicenseExpiry}
      />
      <DriverEmergencyInputs
        emergencyContactName={emergencyContactName}
        emergencyContactPhone={emergencyContactPhone}
        setEmergencyContactName={setEmergencyContactName}
        setEmergencyContactPhone={setEmergencyContactPhone}
      />
      <DriverCompInputs
        baseDailyWage={baseDailyWage}
        city={city}
        setBaseDailyWage={setBaseDailyWage}
        setCity={setCity}
      />
      <Button
        label={mutation.isPending ? 'Saving…' : 'Save details'}
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending}
      />
    </>
  );
}

function DriverShiftsSection({
  shifts,
  loading,
  baseDailyWage,
}: {
  shifts: DriverShiftHistoryRow[];
  loading: boolean;
  baseDailyWage: number | null;
}) {
  const { totalMins, totalEarnings } = computeShiftTotals(shifts, baseDailyWage);

  return (
    <>
      <Text className="mb-2 font-semibold">Shift history</Text>
      {loading
        ? <ActivityIndicator className="py-4" />
        : shifts.length === 0
          ? (
              <EmptyStateWithAnimation
                source={lottieAssets.adminEmptySearch}
                message="No shifts recorded for this driver."
                testID="driver-empty-shifts"
                {...emptyStatePresets.adminCampaignList}
              />
            )
          : (
              <>
                <TotalsSummary totalMins={totalMins} totalEarnings={totalEarnings} />
                {shifts.map(s => (
                  <ShiftHistoryCard key={s.id} row={s} />
                ))}
              </>
            )}
    </>
  );
}

export function DriverDetailScreen() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();

  const driverQuery = useQuery({
    queryKey: ['driver-detail', profileId],
    queryFn: () => fetchDriverByProfileId(profileId!),
    enabled: !!profileId,
  });

  const profileQuery = useQuery({
    queryKey: ['profile-snippet', profileId],
    queryFn: () => fetchProfileSnippet(profileId!),
    enabled: !!profileId,
  });

  const shiftsQuery = useQuery({
    queryKey: ['driver-shifts', profileId],
    queryFn: () => fetchDriverShiftHistory(profileId!),
    enabled: !!profileId,
  });

  const driver = driverQuery.data;
  const displayName = driver?.profiles?.display_name ?? profileQuery.data?.display_name ?? 'Driver';
  const username = driver?.profiles?.username ?? profileQuery.data?.username ?? '';
  const shifts = shiftsQuery.data ?? [];

  if (!profileId || driverQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const formKey = `${profileId}-${driver?.id ?? 'new'}-${driverQuery.dataUpdatedAt}`;

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <AdminHeader title={displayName} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 pb-8" keyboardShouldPersistTaps="handled">
          <Text className="mb-2 text-sm text-neutral-500">
            {username ? `@${username}` : ''}
            {username ? ' · ' : ''}
            Driver profile
          </Text>

          {!driver && (
            <View className="mb-4 rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20">
              <Text className="text-sm text-amber-900 dark:text-amber-200">
                No driver record yet. Fill in details below and save to create one.
              </Text>
            </View>
          )}

          <DriverShiftsSection shifts={shifts} loading={shiftsQuery.isLoading} baseDailyWage={driver?.base_daily_wage ?? null} />

          <DriverProfileForm
            key={formKey}
            profileId={profileId}
            driverRowId={driver?.id ?? null}
            initial={driverFormInitial(driver)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
