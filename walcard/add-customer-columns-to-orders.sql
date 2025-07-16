-- Add Customer Columns to Orders Table
-- Run this in Supabase SQL Editor

-- 1. Check current orders table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 2. Add customer_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_name TEXT;
        RAISE NOTICE 'Added customer_name column';
    ELSE
        RAISE NOTICE 'customer_name column already exists';
    END IF;
END $$;

-- 3. Add customer_phone column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_phone TEXT;
        RAISE NOTICE 'Added customer_phone column';
    ELSE
        RAISE NOTICE 'customer_phone column already exists';
    END IF;
END $$;

-- 4. Add delivery_address column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivery_address'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_address TEXT;
        RAISE NOTICE 'Added delivery_address column';
    ELSE
        RAISE NOTICE 'delivery_address column already exists';
    END IF;
END $$;

-- 5. Add delivery_notes column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivery_notes'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_notes TEXT;
        RAISE NOTICE 'Added delivery_notes column';
    ELSE
        RAISE NOTICE 'delivery_notes column already exists';
    END IF;
END $$;

-- 6. Add order_notes column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_notes'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_notes TEXT;
        RAISE NOTICE 'Added order_notes column';
    ELSE
        RAISE NOTICE 'order_notes column already exists';
    END IF;
END $$;

-- 7. Show final orders table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 8. Insert sample orders with customer data
INSERT INTO orders (
    id,
    user_id,
    store_owner_id,
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

-- 9. Show sample orders with customer data
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
SELECT 'Customer columns added to orders table successfully!' as status; 