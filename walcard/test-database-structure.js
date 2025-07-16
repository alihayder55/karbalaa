const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with correct credentials
const supabaseUrl = 'https://wbpynqwkamxxddoteswm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicHlucXdrYW14eGRkb3Rlc3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY2NzUyNiwiZXhwIjoyMDY1MjQzNTI2fQ.0XTDeQKW70f90Fzj2FZsiRPS-e4TcI253SA9wek4IkQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOrdersTable() {
  try {
    console.log('🔍 Checking orders table structure...');
    
    // Get a sample order to see the structure
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error fetching orders:', error);
      return;
    }
    
    if (orders && orders.length > 0) {
      console.log('✅ Orders table structure:');
      console.log(JSON.stringify(orders[0], null, 2));
    } else {
      console.log('ℹ️ No orders found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkOrdersTable(); 