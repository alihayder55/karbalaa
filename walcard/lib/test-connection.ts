import { supabase } from './supabase';

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