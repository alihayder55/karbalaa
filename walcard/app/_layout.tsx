import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { I18nManager, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    // Initialize AsyncStorage safely
    const initializeAsyncStorage = async () => {
      try {
        console.log('Starting AsyncStorage initialization...');
        
        // Test AsyncStorage by setting and getting a test value
        await AsyncStorage.setItem('test_key', 'test_value');
        const testValue = await AsyncStorage.getItem('test_key');
        await AsyncStorage.removeItem('test_key');
        
        if (testValue !== 'test_value') {
          console.warn('AsyncStorage initialization test failed');
        } else {
          console.log('AsyncStorage initialized successfully');
        }
        
        // Mark as initialized
        setIsInitialized(true);
      } catch (error) {
        console.error('AsyncStorage initialization error:', error);
        // Still mark as initialized to prevent blocking the app
        setIsInitialized(true);
      }
    };

    initializeAsyncStorage();
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
