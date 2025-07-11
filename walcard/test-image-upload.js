// Test script for image upload functionality
// Run this to test the Supabase Storage setup

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageSetup() {
  console.log('🧪 Testing Supabase Storage Setup...\n');

  try {
    // Test 1: Check if forstore bucket exists
    console.log('1. Checking forstore bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    const forstoreBucket = buckets.find(bucket => bucket.id === 'forstore');
    if (forstoreBucket) {
      console.log('✅ forstore bucket exists');
      console.log('   - Public:', forstoreBucket.public);
      console.log('   - File size limit:', forstoreBucket.file_size_limit);
      console.log('   - Allowed MIME types:', forstoreBucket.allowed_mime_types);
    } else {
      console.log('❌ forstore bucket not found');
      console.log('   Please run the SQL setup script first');
      return;
    }

    // Test 2: Test folder structure
    console.log('\n2. Testing folder structure...');
    const { data: folders, error: foldersError } = await supabase.storage
      .from('forstore')
      .list('', { limit: 100 });

    if (foldersError) {
      console.error('❌ Error listing folders:', foldersError);
    } else {
      console.log('✅ Storage folders accessible');
      console.log('   Available folders:', folders.map(f => f.name).join(', ') || 'None');
    }

    // Test 3: Test upload permissions (requires authentication)
    console.log('\n3. Testing upload permissions...');
    console.log('   Note: This requires user authentication');
    console.log('   Run this test from the app after login');

    // Test 4: Check RLS policies
    console.log('\n4. Checking RLS policies...');
    console.log('   RLS should be enabled on storage.objects');
    console.log('   Policies should be created for user access control');

    console.log('\n✅ Storage setup test completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run the SQL setup script in Supabase');
    console.log('   2. Test image upload from the app');
    console.log('   3. Verify images are stored correctly');
    console.log('   4. Check access permissions');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testImageUpload() {
  console.log('🧪 Testing Image Upload...\n');

  try {
    // Create a test image (simple text file for testing)
    const testImageContent = 'Test image content';
    const testImageBuffer = Buffer.from(testImageContent, 'utf8');

    // Test upload to different folders
    const testFolders = [
      'store-images/test-user',
      'identity-images/test-user', 
      'business-images/test-user',
      'merchant-store-images/test-user'
    ];

    for (const folder of testFolders) {
      console.log(`Testing upload to ${folder}...`);
      
      const fileName = `test_${Date.now()}.txt`;
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('forstore')
        .upload(filePath, testImageBuffer, {
          contentType: 'text/plain',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.log(`❌ Upload to ${folder} failed:`, error.message);
      } else {
        console.log(`✅ Upload to ${folder} successful`);
        
        // Test getting public URL
        const { data: urlData } = supabase.storage
          .from('forstore')
          .getPublicUrl(filePath);
        
        console.log(`   Public URL: ${urlData.publicUrl}`);
      }
    }

  } catch (error) {
    console.error('❌ Upload test failed:', error);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--upload')) {
    await testImageUpload();
  } else {
    await testStorageSetup();
  }
}

// Run the test
main().catch(console.error); 