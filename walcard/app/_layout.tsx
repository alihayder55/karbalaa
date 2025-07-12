import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { I18nManager, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Ignore specific warnings that might be causing issues
LogBox.ignoreLogs([
  'Warning: Cannot read property',
  'getString',
  'AsyncStorage',
]);

// Global error handler
if (__DEV__) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('getString')) {
      console.log('Caught getString error:', args);
    }
    originalConsoleError.apply(console, args);
  };
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Force RTL layout for Arabic
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    }

    // Initialize AsyncStorage and session management
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Test AsyncStorage by setting and getting a test value
        await AsyncStorage.setItem('test_key', 'test_value');
        const testValue = await AsyncStorage.getItem('test_key');
        await AsyncStorage.removeItem('test_key');
        
        if (testValue !== 'test_value') {
          console.warn('AsyncStorage initialization test failed');
        } else {
          console.log('AsyncStorage initialized successfully');
        }

        // Initialize Supabase session persistence
        // This ensures the session persists across app restarts
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Found existing session, user remains logged in');
        }

        // Listen for auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN') {
            console.log('User signed in');
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed');
          }
        });
        
        // Mark as initialized
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        // Still mark as initialized to prevent blocking the app
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if ((loaded || error) && isInitialized) {
      // Hide splash screen once fonts are loaded and storage is initialized
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isInitialized]);

  if (!loaded && !error) {
    return null;
  }

  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="index"
          redirect={true}
        />
        <Stack.Screen 
          name="onboarding/welcome"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/merchant-registration" />
        <Stack.Screen name="auth/store-owner-registration" />
        <Stack.Screen name="auth/unified-auth" />
        <Stack.Screen name="auth/unified-login" />
        <Stack.Screen name="auth/user-type-selection" />
        <Stack.Screen name="auth/verify" />
        <Stack.Screen name="auth/pending-approval" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="store-owner" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
