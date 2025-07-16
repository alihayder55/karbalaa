// Test Order Creation
// Run this in Supabase SQL Editor to test order creation

// 1. Test basic order insertion
INSERT INTO orders (
    store_owner_id,
    status,
    total_price,
    order_notes
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'pending',
    150000,
    'طلب اختبار من السكريبت'
) RETURNING id, status, total_price, order_notes;

// 2. Test order with null order_notes
INSERT INTO orders (
    store_owner_id,
    status,
    total_price
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'pending',
    200000
) RETURNING id, status, total_price, order_notes;

// 3. Show all orders
SELECT 
    id,
    status,
    total_price,
    order_notes,
    created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

// 4. Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position; 