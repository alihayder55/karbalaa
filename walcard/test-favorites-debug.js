// Debug script to test favorites functionality
// Run this with: node test-favorites-debug.js

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and key
const supabaseUrl = 'https://wbpynqwkamxxddoteswm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicHlucXdrYW14eGRkb3Rlc3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyOTY0MzYsImV4cCI6MjA0OTg3MjQzNn0.bVN7LZX8Jx7KeqyGR6p0RWTKNMZJNUyoVwqvj7KeDG8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test user ID (replace with the actual user ID from your logs)
const testUserId = 'b756282e-24f5-4654-b7e7-e8e367896fa2';

async function testFavoritesSystem() {
  console.log('🧪 Testing Favorites System...\n');

  try {
    // 1. Test if get_user_favorites function exists
    console.log('1. Testing get_user_favorites function...');
    const { data: favoritesData, error: favoritesError } = await supabase.rpc('get_user_favorites', {
      p_user_id: testUserId
    });

    if (favoritesError) {
      console.error('❌ get_user_favorites error:', favoritesError);
    } else {
      console.log('✅ get_user_favorites result:', favoritesData?.length || 0, 'favorites');
      if (favoritesData && favoritesData.length > 0) {
        console.log('📋 Sample favorite:', favoritesData[0]);
      }
    }

    // 2. Test if user_favorites table exists and has data
    console.log('\n2. Testing user_favorites table...');
    const { data: rawFavorites, error: rawError } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', testUserId);

    if (rawError) {
      console.error('❌ user_favorites table error:', rawError);
    } else {
      console.log('✅ user_favorites table result:', rawFavorites?.length || 0, 'entries');
      if (rawFavorites && rawFavorites.length > 0) {
        console.log('📋 Sample raw favorite:', rawFavorites[0]);
      }
    }

    // 3. Test if products table has data
    console.log('\n3. Testing products table...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .limit(3);

    if (productsError) {
      console.error('❌ products table error:', productsError);
    } else {
      console.log('✅ products table result:', products?.length || 0, 'products');
      if (products && products.length > 0) {
        console.log('📋 Sample product:', products[0]);
      }
    }

    // 4. Test toggle_favorite function with a sample product
    if (products && products.length > 0) {
      const testProductId = products[0].id;
      console.log('\n4. Testing toggle_favorite function with product:', testProductId);
      
      const { data: toggleResult, error: toggleError } = await supabase.rpc('toggle_favorite', {
        p_user_id: testUserId,
        p_product_id: testProductId
      });

      if (toggleError) {
        console.error('❌ toggle_favorite error:', toggleError);
      } else {
        console.log('✅ toggle_favorite result:', toggleResult);
      }

      // Test again to see the status after toggle
      console.log('\n5. Testing favorites after toggle...');
      const { data: afterToggle, error: afterError } = await supabase.rpc('get_user_favorites', {
        p_user_id: testUserId
      });

      if (afterError) {
        console.error('❌ get_user_favorites after toggle error:', afterError);
      } else {
        console.log('✅ get_user_favorites after toggle:', afterToggle?.length || 0, 'favorites');
      }
    }

    // 6. Test database structure
    console.log('\n6. Testing database structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name')
      .eq('table_name', 'user_favorites');

    if (tableError) {
      console.error('❌ Cannot check table structure:', tableError);
    } else {
      console.log('✅ user_favorites table structure:', tableInfo);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test
testFavoritesSystem()
  .then(() => {
    console.log('\n🎉 Favorites system test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }); 