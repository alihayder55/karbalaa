const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wbpynqwkamxxddoteswm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicHlucXdrYW14eGRkb3Rlc3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY2NzUyNiwiZXhwIjoyMDY1MjQzNTI2fQ.0XTDeQKW70f90Fzj2FZsiRPS-e4TcI253SA9wek4IkQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableStructure() {
  console.log('🔍 Checking product_categories table structure...');
  
  try {
    // Get all columns from the table
    const { data: allData, error: allError } = await supabase
      .from('product_categories')
      .select('*')
      .limit(1);

    if (allError) {
      console.error('❌ Error accessing table:', allError);
      return;
    }

    console.log('✅ Table accessible');
    console.log('📋 Sample data:', allData);
    
    if (allData && allData.length > 0) {
      const sampleRecord = allData[0];
      console.log('\n🔍 Table columns:');
      Object.keys(sampleRecord).forEach(key => {
        console.log(`- ${key}: ${typeof sampleRecord[key]} = ${sampleRecord[key]}`);
      });
    }

    // Try to get all categories without parent_id
    const { data: categories, error: categoriesError } = await supabase
      .from('product_categories')
      .select('id, name, description, image_URL')
      .order('name');

    if (categoriesError) {
      console.error('❌ Error getting categories:', categoriesError);
    } else {
      console.log('\n📋 All categories (without parent_id):', categories);
      console.log('📊 Total categories:', categories?.length || 0);
    }

  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

checkTableStructure(); 