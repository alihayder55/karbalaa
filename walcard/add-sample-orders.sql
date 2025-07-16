-- Add Sample Orders with Customer Data
-- Run this in Supabase SQL Editor

-- 1. Insert sample orders with customer data
INSERT INTO orders (
    id,
    user_id,
    merchant_id,
    status,
    total_price,
    customer_name,
    customer_phone,
    delivery_address,
    delivery_notes,
    order_notes,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    NULL,
    NULL,
    'pending',
    150000,
    'أحمد محمد علي',
    '+9647501234567',
    'شارع الرشيد، بغداد، العراق',
    'يرجى التوصيل في الصباح قبل الساعة 10',
    'طلب عاجل - يرجى التحضير بسرعة',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    NULL,
    NULL,
    'confirmed',
    250000,
    'فاطمة حسن',
    '+9647509876543',
    'شارع فلسطين، بغداد، العراق',
    'التوصيل في المساء بعد الساعة 6',
    'يرجى التأكد من جودة المنتجات',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    NULL,
    NULL,
    'preparing',
    180000,
    'محمد عبدالله',
    '+9647505551234',
    'شارع الكفاح، بغداد، العراق',
    'التوصيل في أي وقت مناسب',
    'منتجات طازجة مطلوبة',
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- 2. Get the order IDs we just created
WITH new_orders AS (
    SELECT id FROM orders 
    WHERE customer_name IN ('أحمد محمد علي', 'فاطمة حسن', 'محمد عبدالله')
    ORDER BY created_at DESC
    LIMIT 3
)
SELECT id, customer_name, customer_phone, delivery_address 
FROM orders 
WHERE id IN (SELECT id FROM new_orders);

-- 3. Show all orders with customer data
SELECT 
    id,
    status,
    total_price,
    customer_name,
    customer_phone,
    delivery_address,
    delivery_notes,
    order_notes,
    created_at
FROM orders 
WHERE customer_name IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5;

-- Success message
SELECT 'Sample orders with customer data added successfully!' as status; 