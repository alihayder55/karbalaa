-- Simple Orders Table Fix
-- Run this in Supabase SQL Editor

-- 1. Check current orders table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 2. Add order_notes column if it doesn't exist
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

-- 3. Ensure orders table has basic structure
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_owner_id UUID,
    status TEXT DEFAULT 'pending',
    total_price NUMERIC(12, 2) NOT NULL,
    order_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ensure order_items table exists
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID,
    quantity INTEGER NOT NULL,
    price_at_order NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Show final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 6. Test insert
INSERT INTO orders (
    store_owner_id,
    status,
    total_price,
    order_notes
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'pending',
    100000,
    'طلب تجريبي'
) ON CONFLICT DO NOTHING;

-- 7. Show test data
SELECT * FROM orders ORDER BY created_at DESC LIMIT 3;

-- Success message
SELECT 'Orders table fixed successfully!' as status; 