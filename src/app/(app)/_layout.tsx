import { Redirect, Stack, usePathname, useRouter, useSegments } from 'expo-router';
import * as React from 'react';

import { OfflineOverlay } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';

// Splash screen auto-hides after first render (preventAutoHideAsync is
// disabled in the root layout due to an iOS 26 beta freeze bug).
// No manual hideAsync() calls are needed.

export default function AppLayout() {
  const status = useAuthStore.use.status();
  const profile = useAuthStore.use.profile();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  // Redirect to correct role section on hydration
  React.useEffect(() => {
    if (status !== 'signIn' || !profile)
      return;

    // Pathname is reliable across Expo Router versions; segments alone can omit groups.
    const inAdmin
      = pathname.includes('/admin') || segments.includes('admin' as never);
    const inClient
      = pathname.includes('/client') || segments.includes('client' as never);

    const role = profile.role;
    if (role === 'admin' && !inAdmin) {
      router.replace('/(app)/admin/campaigns');
    }
    else if (role === 'client' && !inClient) {
      router.replace('/(app)/client');
    }
    // driver stays on default /(app) index — no redirect needed
  }, [status, profile, segments, pathname, router]);

  if (status === 'signOut') {
    return <Redirect href="/login" />;
  }

  return (
    <>
      <OfflineOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Driver screens */}
        <Stack.Screen name="index" />
        <Stack.Screen name="driver-analytics" />
        <Stack.Screen name="upload" />
        <Stack.Screen name="upload-success" />
        {/* Admin screens */}
        <Stack.Screen name="admin" />
        {/* Client screens */}
        <Stack.Screen name="client" />
      </Stack>
    </>
  );
}
