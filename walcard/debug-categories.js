const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wbpynqwkamxxddoteswm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicHlucXdrYW14eGRkb3Rlc3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY2NzUyNiwiZXhwIjoyMDY1MjQzNTI2fQ.0XTDeQKW70f90Fzj2FZsiRPS-e4TcI253SA9wek4IkQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugCategories() {
  console.log('🔍 Debugging categories...');
  
  try {
    // Test 1: Check if table exists
    const { data: testData, error: testError } = await supabase
      .from('product_categories')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Table access error:', testError);
      return;
    }

    console.log('✅ Table accessible');

    // Test 2: Get all categories
    const { data: allCategories, error: allError } = await supabase
      .from('product_categories')
      .select('*');

    if (allError) {
      console.error('❌ Error getting all categories:', allError);
      return;
    }

    console.log('📋 All categories:', allCategories);
    console.log('📊 Total categories found:', allCategories?.length || 0);

    // Test 3: Check parent_id values
    if (allCategories && allCategories.length > 0) {
      console.log('\n🔍 Checking parent_id values:');
      allCategories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name}: parent_id = ${cat.parent_id} (type: ${typeof cat.parent_id})`);
      });
    }

    // Test 4: Filter for parent categories
    const parentCategories = allCategories?.filter(cat => {
      const isParent = !cat.parent_id || cat.parent_id === null;
      console.log(`Filtering ${cat.name}: parent_id=${cat.parent_id}, isParent=${isParent}`);
      return isParent;
    }) || [];

    console.log('\n🏠 Parent categories after filter:', parentCategories);
    console.log('📊 Parent categories count:', parentCategories.length);

    // Test 5: Check if any categories have null parent_id
    const nullParentCategories = allCategories?.filter(cat => cat.parent_id === null) || [];
    console.log('\n📋 Categories with null parent_id:', nullParentCategories);
    console.log('📊 Null parent_id count:', nullParentCategories.length);

    // Test 6: Check if any categories have undefined parent_id
    const undefinedParentCategories = allCategories?.filter(cat => cat.parent_id === undefined) || [];
    console.log('\n📋 Categories with undefined parent_id:', undefinedParentCategories);
    console.log('📊 Undefined parent_id count:', undefinedParentCategories.length);

  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

debugCategories(); 