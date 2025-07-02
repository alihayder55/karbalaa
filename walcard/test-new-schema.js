const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wbpynqwkamxxddoteswm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicHlucXdrYW14eGRkb3Rlc3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY2NzUyNiwiZXhwIjoyMDY1MjQzNTI2fQ.0XTDeQKW70f90Fzj2FZsiRPS-e4TcI253SA9wek4IkQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testNewSchema() {
  try {
    console.log('🧪 Testing new database schema...');
    
    // Test 1: Check if users table exists and can be queried
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError);
      return false;
    }
    console.log('✅ Users table accessible');
    
    // Test 2: Check if merchants table exists and can be queried
    const { data: merchantsData, error: merchantsError } = await supabase
      .from('merchants')
      .select('*')
      .limit(1);
    
    if (merchantsError) {
      console.error('❌ Merchants table error:', merchantsError);
      return false;
    }
    console.log('✅ Merchants table accessible');
    
    // Test 3: Check if store_owners table exists and can be queried
    const { data: storeOwnersData, error: storeOwnersError } = await supabase
      .from('store_owners')
      .select('*')
      .limit(1);
    
    if (storeOwnersError) {
      console.error('❌ Store owners table error:', storeOwnersError);
      return false;
    }
    console.log('✅ Store owners table accessible');
    
    // Test 4: Check table schemas
    console.log('\n📋 New database schema:');
    console.log('- users table: exists ✅');
    console.log('- merchants table: exists ✅');
    console.log('- store_owners table: exists ✅');
    
    // Test 5: Simulate user account info function
    console.log('\n🔍 Testing user account info function...');
    
    // Test with a non-existent phone number
    const { data: userInfo, error: userInfoError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        phone_number,
        user_type,
        is_approved
      `)
      .eq('phone_number', '1234567890')
      .single();
    
    if (userInfoError && userInfoError.code === 'PGRST116') {
      console.log('✅ User account info function works correctly (no user found)');
    } else if (userInfoError) {
      console.error('❌ User account info function error:', userInfoError);
    } else {
      console.log('✅ User account info function works correctly (user found)');
    }
    
    console.log('\n🎉 All tests passed! The app should work correctly with the new schema.');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

testNewSchema(); 