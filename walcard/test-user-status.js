const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wbpynqwkamxxddoteswm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicHlucXdrYW14eGRkb3Rlc3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY2NzUyNiwiZXhwIjoyMDY1MjQzNTI2fQ.0XTDeQKW70f90Fzj2FZsiRPS-e4TcI253SA9wek4IkQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserStatus() {
  try {
    console.log('🔍 Testing user status...');
    
    // Test phone number
    const testPhone = '+9647860607907';
    
    console.log(`\n📱 Checking user with phone: ${testPhone}`);
    
    // Check user in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', testPhone)
      .single();
    
    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return;
    }
    
    if (!userData) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: userData.id,
      full_name: userData.full_name,
      phone_number: userData.phone_number,
      user_type: userData.user_type,
      is_approved: userData.is_approved
    });
    
    // Check if user has merchant account
    const { data: merchantData } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', userData.id)
      .maybeSingle();
    
    console.log('🏪 Merchant account:', merchantData ? 'Exists' : 'Not found');
    
    // Check if user has store owner account
    const { data: storeOwnerData } = await supabase
      .from('store_owners')
      .select('*')
      .eq('user_id', userData.id)
      .maybeSingle();
    
    console.log('🏬 Store owner account:', storeOwnerData ? 'Exists' : 'Not found');
    
    // Determine user status
    console.log('\n📊 User Status Summary:');
    console.log(`- User Type: ${userData.user_type}`);
    console.log(`- Approval Status: ${userData.is_approved ? 'Approved ✅' : 'Pending ⏳'}`);
    console.log(`- Has Merchant Account: ${merchantData ? 'Yes' : 'No'}`);
    console.log(`- Has Store Owner Account: ${storeOwnerData ? 'Yes' : 'No'}`);
    
    if (!userData.is_approved) {
      console.log('\n⚠️  WARNING: User is not approved but might be able to access the app!');
      console.log('This should redirect to pending approval page.');
    } else {
      console.log('\n✅ User is approved and can access the app.');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testUserStatus(); 