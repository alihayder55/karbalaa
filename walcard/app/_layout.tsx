import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { setupRTL } from '../lib/rtl-config';

export default function RootLayout() {
  useEffect(() => {
    // تفعيل RTL عند بدء التطبيق
    setupRTL();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureDirection: 'horizontal',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}
