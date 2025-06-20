import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://kkfkwaiiblnvhmmitie.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZmt3d2FpYmxudmhtbWl0dGllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA4NzU0OTIsImV4cCI6MjAzNjQ1MTQ5Mn0.u2_ardyhXxizBV8qTR1zkSjDEIu3XUhw0lpwwB5cRDQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: AsyncStorage,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Add retry logic for network requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const retryRequest = async (fn: () => Promise<any>, retries = MAX_RETRIES): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && error.message?.includes('Network request failed')) {
      console.log(`Retrying request... ${retries} attempts remaining`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
};

// Wrap Supabase auth methods with retry logic
const originalSignInWithOtp = supabase.auth.signInWithOtp;
supabase.auth.signInWithOtp = async (...args) => {
  return retryRequest(() => originalSignInWithOtp.apply(supabase.auth, args));
};

// 
export function getSupabaseUrl(path: string): string {
  return supabaseUrl + '/storage/v1/object/public/' + path
}
export function getSupabaseUrl1(path: string): string {
  return path
}
export { supabase }; 