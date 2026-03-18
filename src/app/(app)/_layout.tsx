import { Redirect, SplashScreen, Stack } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect } from 'react';

import { useAuthStore } from '@/features/auth/use-auth-store';

export default function DriverLayout() {
  const status = useAuthStore.use.status();

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (status !== 'idle') {
      const timer = setTimeout(() => {
        hideSplash();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hideSplash, status]);

  // Fallback: force-hide splash after 5s to expose any underlying errors
  useEffect(() => {
    const fallback = setTimeout(() => {
      hideSplash();
    }, 5000);
    return () => clearTimeout(fallback);
  }, [hideSplash]);

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
