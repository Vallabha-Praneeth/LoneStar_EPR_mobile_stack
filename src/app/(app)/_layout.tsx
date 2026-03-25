import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import * as React from 'react';

import { useAuthStore } from '@/features/auth/use-auth-store';

// Splash screen auto-hides after first render (preventAutoHideAsync is
// disabled in the root layout due to an iOS 26 beta freeze bug).
// No manual hideAsync() calls are needed.

export default function AppLayout() {
  const status = useAuthStore.use.status();
  const profile = useAuthStore.use.profile();
  const router = useRouter();
  const segments = useSegments();

  // Redirect to correct role section on hydration
  React.useEffect(() => {
    if (status !== 'signIn' || !profile)
      return;

    const inAdmin = segments.includes('admin' as never);
    const inClient = segments.includes('client' as never);

    if (profile.role === 'admin' && !inAdmin) {
      router.replace('/(app)/admin/campaigns');
    }
    else if (profile.role === 'client' && !inClient) {
      router.replace('/(app)/client');
    }
    // driver stays on default /(app) index — no redirect needed
  }, [status, profile, segments, router]);

  if (status === 'signOut') {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Driver screens */}
      <Stack.Screen name="index" />
      <Stack.Screen name="upload" />
      <Stack.Screen name="upload-success" />
      {/* Admin screens */}
      <Stack.Screen name="admin" />
      {/* Client screens */}
      <Stack.Screen name="client" />
    </Stack>
  );
}
