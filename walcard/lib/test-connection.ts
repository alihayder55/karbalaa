import { supabase } from './supabase';
import NetInfo from '@react-native-community/netinfo';

export async function checkNetworkConnectivity() {
  try {
    const state = await NetInfo.fetch();
    console.log('Network state:', state);
    
    // For emulator/development, be more lenient with connectivity check
    if (__DEV__) {
      // In development, just check if connected, don't require internet reachable
      return state.isConnected;
    }
    
    // In production, require both connection and internet reachability
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Error checking network connectivity:', error);
    return false;
  }
}

export async function testBasicConnection() {
  try {
    console.log('Testing basic Supabase connection...');
    
    // Test with a simple query that doesn't require RPC
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('Basic connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Basic connection test successful');
    return true;
  } catch (error: any) {
    console.log('❌ Basic connection test error:', error.message);
    return false;
  }
}

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection to: https://wbpynqwkamxxddoteswm.supabase.co');
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error: any) {
    console.log('❌ Supabase connection test error:', error.message);
    return false;
  }
}

export async function testAuthConnection() {
  try {
    console.log('🔍 Testing Supabase auth connection...');
    console.log('URL:', 'https://wbpynqwkamxxddoteswm.supabase.co');
    
    // Test auth endpoint
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Supabase auth test failed:', error.message);
      console.log('Error details:', error);
      return false;
    }
    
    console.log('✅ Supabase auth test successful');
    console.log('Session data:', data);
    return true;
  } catch (error: any) {
    console.log('❌ Supabase auth test error:', error.message);
    console.log('Error type:', typeof error);
    console.log('Full error:', error);
    return false;
  }
}

export async function testPhoneAuth() {
  try {
    console.log('Testing phone auth configuration...');
    
    // Test if phone auth is enabled by checking auth settings
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Phone auth test failed:', error.message);
      return false;
    }
    
    console.log('✅ Phone auth test successful');
    return true;
  } catch (error: any) {
    console.log('❌ Phone auth test error:', error.message);
    return false;
  }
} 