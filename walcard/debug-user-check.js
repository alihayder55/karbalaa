const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wbpynqwkamxxddoteswm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicHlucXdrYW14eGRkb3Rlc3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY2NzUyNiwiZXhwIjoyMDY1MjQzNTI2fQ.0XTDeQKW70f90Fzj2FZsiRPS-e4TcI253SA9wek4IkQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugUserCheck() {
  try {
    console.log('🔍 Debugging user check...');
    
    // Test 1: Check all users in the database
    console.log('\n📋 All users in database:');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*');
    
    if (allUsersError) {
      console.error('❌ Error fetching all users:', allUsersError);
    } else {
      console.log('✅ Users found:', allUsers.length);
      allUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}, Name: ${user.full_name}, Phone: ${user.phone_number}, Type: ${user.user_type}, Approved: ${user.is_approved}`);
      });
    }
    
    // Test 2: Check specific phone number (replace with actual phone number)
    const testPhone = '+9647810277890'; // Replace with actual phone number
    console.log(`\n🔍 Testing specific phone: ${testPhone}`);
    
    const { data: specificUser, error: specificUserError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', testPhone)
      .maybeSingle();
    
    if (specificUserError) {
      console.error('❌ Error fetching specific user:', specificUserError);
    } else if (specificUser) {
      console.log('✅ Specific user found:', specificUser);
      
      // Check if user has merchant account
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', specificUser.id)
        .maybeSingle();
      
      console.log('🏪 Merchant data:', merchantData);
      
      // Check if user has store owner account
      const { data: storeOwnerData } = await supabase
        .from('store_owners')
        .select('*')
        .eq('user_id', specificUser.id)
        .maybeSingle();
      
      console.log('🏬 Store owner data:', storeOwnerData);
    } else {
      console.log('❌ No user found with this phone number');
    }
    
    // Test 3: Check merchants table
    console.log('\n🏪 All merchants:');
    const { data: allMerchants, error: merchantsError } = await supabase
      .from('merchants')
      .select('*');
    
    if (merchantsError) {
      console.error('❌ Error fetching merchants:', merchantsError);
    } else {
      console.log('✅ Merchants found:', allMerchants.length);
      allMerchants.forEach((merchant, index) => {
        console.log(`  ${index + 1}. User ID: ${merchant.user_id}, Business: ${merchant.business_name}`);
      });
    }
    
    // Test 4: Check store owners table
    console.log('\n🏬 All store owners:');
    const { data: allStoreOwners, error: storeOwnersError } = await supabase
      .from('store_owners')
      .select('*');
    
    if (storeOwnersError) {
      console.error('❌ Error fetching store owners:', storeOwnersError);
    } else {
      console.log('✅ Store owners found:', allStoreOwners.length);
      allStoreOwners.forEach((storeOwner, index) => {
        console.log(`  ${index + 1}. User ID: ${storeOwner.user_id}, Store: ${storeOwner.store_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugUserCheck(); 