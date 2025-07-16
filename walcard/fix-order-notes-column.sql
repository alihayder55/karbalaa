-- Fix Missing order_notes Column in Orders Table
-- Run this script in Supabase SQL Editor to add the missing order_notes column

-- 1. Add order_notes column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_notes'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_notes TEXT;
        RAISE NOTICE 'Added order_notes column to orders table';
    ELSE
        RAISE NOTICE 'order_notes column already exists in orders table';
    END IF;
END $$;

-- 2. Add delivery_address column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivery_address'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_address TEXT;
        RAISE NOTICE 'Added delivery_address column to orders table';
    ELSE
        RAISE NOTICE 'delivery_address column already exists in orders table';
    END IF;
END $$;

-- 3. Add delivery_notes column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivery_notes'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_notes TEXT;
        RAISE NOTICE 'Added delivery_notes column to orders table';
    ELSE
        RAISE NOTICE 'delivery_notes column already exists in orders table';
    END IF;
END $$;

-- 4. Add customer_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_name TEXT;
        RAISE NOTICE 'Added customer_name column to orders table';
    ELSE
        RAISE NOTICE 'customer_name column already exists in orders table';
    END IF;
END $$;

-- 5. Add customer_phone column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_phone TEXT;
        RAISE NOTICE 'Added customer_phone column to orders table';
    ELSE
        RAISE NOTICE 'customer_phone column already exists in orders table';
    END IF;
END $$;

-- 6. Show current orders table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 7. Insert sample order data for testing (if needed)
INSERT INTO orders (
    store_owner_id,
    status,
    total_price,
    order_notes,
    delivery_address,
    delivery_notes,
    customer_name,
    customer_phone
) VALUES 
(
    '00000000-0000-0000-0000-000000000001', -- Replace with actual store_owner_id
    'pending',
    150000,
    'طلب عادي',
    'شارع الرشيد، بغداد',
    'يرجى التوصيل في الصباح',
    'أحمد محمد',
    '+9647501234567'
),
(
    '00000000-0000-0000-0000-000000000001', -- Replace with actual store_owner_id
    'confirmed',
    250000,
    'طلب عاجل',
    'شارع فلسطين، بغداد',
    'التوصيل في المساء',
    'فاطمة علي',
    '+9647509876543'
)
ON CONFLICT DO NOTHING;

-- 8. Show sample orders
SELECT 
    id,
    status,
    total_price,
    order_notes,
    delivery_address,
    customer_name,
    created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

-- Success message
SELECT 'Orders table updated successfully! All required columns are now available.' as status; 