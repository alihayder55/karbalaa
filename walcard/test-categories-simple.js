const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wbpynqwkamxxddoteswm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicHlucXdrYW14eGRkb3Rlc3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY2NzUyNiwiZXhwIjoyMDY1MjQzNTI2fQ.0XTDeQKW70f90Fzj2FZsiRPS-e4TcI253SA9wek4IkQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCategories() {
  console.log('🔍 Testing categories in database...');
  
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

    // Test 3: Get parent categories only
    const parentCategories = allCategories?.filter(cat => !cat.parent_id) || [];
    console.log('🏠 Parent categories:', parentCategories);
    console.log('📊 Parent categories count:', parentCategories.length);

    // Test 4: Get subcategories
    const subCategories = allCategories?.filter(cat => cat.parent_id) || [];
    console.log('📁 Subcategories:', subCategories);
    console.log('📊 Subcategories count:', subCategories.length);

  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testCategories(); 