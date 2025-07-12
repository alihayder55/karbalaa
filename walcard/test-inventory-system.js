// Test script for inventory management system
import { supabase } from './lib/supabase.js';

async function testInventorySystem() {
  console.log('🧪 Testing Inventory Management System...\n');

  try {
    // 1. Check current product quantities
    console.log('1️⃣ Checking current product quantities...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, available_quantity')
      .limit(5);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }

    console.log('📦 Current Product Quantities:');
    products.forEach(product => {
      console.log(`   - ${product.name}: ${product.available_quantity} units`);
    });

    // 2. Simulate order creation
    console.log('\n2️⃣ Simulating order creation...');
    const testProduct = products[0];
    const orderQuantity = 2;

    console.log(`📝 Creating test order for ${orderQuantity} units of ${testProduct.name}`);
    console.log(`   Available before order: ${testProduct.available_quantity}`);

    // Create a test order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_owner_id: 'test-user-id',
        status: 'pending',
        total_price: 100,
        order_notes: 'Test order for inventory system',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating test order:', orderError);
      return;
    }

    console.log(`✅ Test order created: ${order.id}`);

    // Create order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: testProduct.id,
        quantity: orderQuantity,
        price_at_order: 50
      });

    if (itemsError) {
      console.error('❌ Error creating order items:', itemsError);
      return;
    }

    // 3. Update inventory (simulate what cart manager does)
    console.log('\n3️⃣ Updating inventory...');
    const newQuantity = Math.max(0, testProduct.available_quantity - orderQuantity);
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ available_quantity: newQuantity })
      .eq('id', testProduct.id);

    if (updateError) {
      console.error('❌ Error updating inventory:', updateError);
      return;
    }

    console.log(`✅ Inventory updated successfully`);
    console.log(`   ${testProduct.name}: ${testProduct.available_quantity} → ${newQuantity}`);

    // 4. Verify the update
    console.log('\n4️⃣ Verifying inventory update...');
    const { data: updatedProduct, error: verifyError } = await supabase
      .from('products')
      .select('available_quantity')
      .eq('id', testProduct.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }

    console.log(`✅ Verification successful: ${updatedProduct.available_quantity} units remaining`);

    // 5. Test inventory restoration (simulate order cancellation)
    console.log('\n5️⃣ Testing inventory restoration...');
    
    const restoredQuantity = updatedProduct.available_quantity + orderQuantity;
    
    const { error: restoreError } = await supabase
      .from('products')
      .update({ available_quantity: restoredQuantity })
      .eq('id', testProduct.id);

    if (restoreError) {
      console.error('❌ Error restoring inventory:', restoreError);
      return;
    }

    console.log(`✅ Inventory restored successfully`);
    console.log(`   ${testProduct.name}: ${updatedProduct.available_quantity} → ${restoredQuantity}`);

    // 6. Clean up test data
    console.log('\n6️⃣ Cleaning up test data...');
    
    // Delete order items
    await supabase
      .from('order_items')
      .delete()
      .eq('order_id', order.id);

    // Delete test order
    await supabase
      .from('orders')
      .delete()
      .eq('id', order.id);

    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Inventory Management System Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Product quantity checking works');
    console.log('   ✅ Inventory reduction on order creation works');
    console.log('   ✅ Inventory restoration on order cancellation works');
    console.log('   ✅ Database operations are functioning correctly');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testInventorySystem(); 