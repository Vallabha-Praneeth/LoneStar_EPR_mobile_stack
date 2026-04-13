import type { ClientCampaignRow } from '@/lib/api/client/campaigns';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as React from 'react';
import { Modal, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/app-logo';
import { DriverTransitBadge } from '@/components/driver-transit-badge';
import {
  LottieAnimation,
  lottieAssets,
  SpinnerAnimation,
  TruckAnimation,
  WelcomeCharacterAnimation,
} from '@/components/motion';
import { StatusBadge } from '@/components/status-badge';
import { Text, View } from '@/components/ui';
import { Camera, Clock, LogOut } from '@/components/ui/icons';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchClientCampaigns } from '@/lib/api/client/campaigns';
import { motionTokens } from '@/lib/motion/tokens';

// ─── Helpers ──────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)
    return 'Good morning';
  if (hour >= 12 && hour < 17)
    return 'Good afternoon';
  if (hour >= 17 && hour < 21)
    return 'Good evening';
  return 'Good night';
}

function firstName(displayName: string): string {
  return displayName.split(' ')[0] ?? displayName;
}

// ─── Box-opening overlay ──────────────────────────────────────────

function CampaignOpenOverlay({ visible }: { visible: boolean }) {
  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/60">
        <LottieAnimation
          source={lottieAssets.clientEmptyBox}
          size={220}
          loop={false}
          autoPlay
          speed={1.2}
        />
      </View>
    </Modal>
  );
}

// ─── Welcome hero ─────────────────────────────────────────────────

function WelcomeHero({ name }: { name: string }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 80 }}
      className="mx-4 mt-4 overflow-hidden rounded-3xl bg-primary-600"
    >
      <View className="flex-row items-start justify-between px-5 pt-5 pb-4">
        {/* Text block */}
        <View className="flex-1 gap-0.5 pr-2">
          <MotiView
            from={{ opacity: 0, translateX: -8 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 180 }}
          >
            <Text className="text-xs font-semibold tracking-widest text-primary-200 uppercase">
              LoneStar Billboards
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateX: -8 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 240 }}
          >
            <Text className="mt-2 text-2xl font-bold text-white">
              {`${getGreeting()},`}
            </Text>
            <Text className="text-xl font-semibold text-white" numberOfLines={1}>
              {`${name}!`}
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 360 }}
          >
            <Text className="mt-2 text-sm/5 text-primary-100">
              Here's a look at your billboard campaigns.
            </Text>
          </MotiView>
        </View>

        {/* Character animation */}
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={motionTokens.spring.gentle}
        >
          <WelcomeCharacterAnimation size={110} />
        </MotiView>
      </View>
    </MotiView>
  );
}

// ─── Campaign card ────────────────────────────────────────────────

function CampaignCard({ campaign, index }: { campaign: ClientCampaignRow; index: number }) {
  const router = useRouter();
  const [opening, setOpening] = React.useState(false);

  function handlePress() {
    setOpening(true);
    setTimeout(() => {
      setOpening(false);
      router.push(`/(app)/client/campaign/${campaign.id}`);
    }, 1100);
  }

  return (
    <>
      <CampaignOpenOverlay visible={opening} />
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: motionTokens.duration.base, delay: index * 60 }}
        className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.8}
          className="flex-row items-center justify-between p-4"
        >
          <View className="flex-1 gap-1 pr-3">
            <Text className="text-sm font-semibold" numberOfLines={1}>{campaign.title}</Text>
            <Text className="text-xs text-neutral-500">
              {`${format(new Date(`${campaign.campaign_date}T12:00:00`), 'MMM d, yyyy')}${campaign.photo_count > 0 ? ` · ${campaign.photo_count} photo${campaign.photo_count !== 1 ? 's' : ''}` : ''}`}
            </Text>
          </View>
          <StatusBadge status={campaign.status} />
        </TouchableOpacity>
        {campaign.hasActiveShift && campaign.status === 'active' && (
          <View className="px-4 pb-3">
            <DriverTransitBadge />
          </View>
        )}
      </MotiView>
    </>
  );
}

// ─── Campaign list body ───────────────────────────────────────────

function CampaignListBody({
  campaigns,
  name,
  bottomInset,
}: {
  campaigns: ClientCampaignRow[] | undefined;
  name: string;
  bottomInset: number;
}) {
  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <WelcomeHero name={name} />

      {(campaigns?.length ?? 0) === 0 && (
        <View className="mx-4 mt-4">
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={motionTokens.spring.gentle}
            className="items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <TruckAnimation size={140} />
            <Text className="text-center text-sm text-neutral-500">
              No campaigns assigned to your account yet.
            </Text>
          </MotiView>
        </View>
      )}

      {(campaigns?.length ?? 0) > 0 && (
        <View className="mt-5 gap-3 px-4">
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: motionTokens.duration.base, delay: 200 }}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-1.5">
              <Camera color="#737373" width={14} height={14} />
              <Text className="text-sm font-semibold">Your Campaigns</Text>
            </View>
            <Text className="text-xs text-neutral-500">{`${campaigns!.length} total`}</Text>
          </MotiView>
          {campaigns!.map((c, i) => (
            <CampaignCard key={c.id} campaign={c} index={i} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────

export function ClientLandingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useAuthStore.use.profile();
  const signOut = useAuthStore.use.signOut();

  const { data: campaigns, isLoading, isError } = useQuery<ClientCampaignRow[]>({
    queryKey: ['client-campaigns', profile?.client_id],
    queryFn: () => fetchClientCampaigns(profile!.client_id!),
    enabled: !!profile?.client_id,
  });

  const name = firstName(profile?.display_name ?? 'there');

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: motionTokens.duration.base }}
        className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pb-3 dark:border-neutral-700 dark:bg-neutral-800"
        style={{ paddingTop: insets.top + 8 }}
      >
        <AppLogo size="sm" showText />
        <View className="flex-row items-center gap-1">
          <ThemeToggle />
          <TouchableOpacity
            onPress={() => router.push('/(app)/client/timing')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
            accessibilityLabel="Timing sheet"
          >
            <Clock color="#737373" width={18} height={18} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={signOut}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="size-8 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-700"
          >
            <LogOut color="#737373" width={18} height={18} />
          </TouchableOpacity>
        </View>
      </MotiView>

      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <SpinnerAnimation size={64} />
        </View>
      )}
      {isError && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-neutral-500">
            Couldn't load campaigns. Please try again.
          </Text>
        </View>
      )}
      {!isLoading && !isError && (
        <CampaignListBody campaigns={campaigns} name={name} bottomInset={insets.bottom} />
      )}
    </View>
  );
}
