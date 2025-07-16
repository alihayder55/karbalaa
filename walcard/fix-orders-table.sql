-- Fix Orders Table - Add Missing Columns
-- Run this in Supabase SQL Editor

-- 1. Check current orders table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
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

-- 8. Insert sample order for testing
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
    NULL, -- user_id will be set when user creates order
    NULL, -- merchant_id will be set when merchant is selected
    'pending',
    250000,
    'أحمد محمد',
    '+9647501234567',
    'شارع الرشيد، بغداد، العراق',
    'يرجى التوصيل في الصباح قبل الساعة 10',
    'طلب عاجل - يرجى التحضير بسرعة',
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- 9. Show sample orders
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
ORDER BY created_at DESC 
LIMIT 3;

-- Success message
SELECT 'Orders table updated successfully! All required columns are now available.' as status; 