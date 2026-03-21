import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/use-auth-store';

// Splash screen auto-hides after first render (preventAutoHideAsync is
// disabled in the root layout due to an iOS 26 beta freeze bug).
// No manual hideAsync() calls are needed.

export default function DriverLayout() {
  const status = useAuthStore.use.status();

  if (status === 'signOut') {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="upload" />
      <Stack.Screen name="upload-success" />
    </Stack>
  );
}
