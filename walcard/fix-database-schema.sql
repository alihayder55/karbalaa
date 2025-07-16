-- Fix Database Schema - Remove available_quantity and use is_active
-- Run this in Supabase SQL Editor

-- 1. Check current products table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 2. Remove available_quantity column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'available_quantity'
    ) THEN
        ALTER TABLE products DROP COLUMN available_quantity;
        RAISE NOTICE 'Removed available_quantity column from products table';
    ELSE
        RAISE NOTICE 'available_quantity column does not exist in products table';
    END IF;
END $$;

-- 3. Ensure is_active column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to products table';
    ELSE
        RAISE NOTICE 'is_active column already exists in products table';
    END IF;
END $$;

-- 4. Update existing products to have is_active = true
UPDATE products 
SET is_active = true 
WHERE is_active IS NULL;

-- 5. Show final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 6. Insert sample products for testing
INSERT INTO products (
    name,
    description,
    price,
    discount_price,
    image_url,
    is_active,
    category_id,
    merchant_id
) VALUES 
(
    'منتج تجريبي 1',
    'وصف المنتج التجريبي الأول',
    100000,
    80000,
    'https://example.com/image1.jpg',
    true,
    NULL,
    NULL
),
(
    'منتج تجريبي 2',
    'وصف المنتج التجريبي الثاني',
    150000,
    NULL,
    'https://example.com/image2.jpg',
    true,
    NULL,
    NULL
),
(
    'منتج غير متوفر',
    'منتج غير متوفر للاختبار',
    200000,
    NULL,
    'https://example.com/image3.jpg',
    false,
    NULL,
    NULL
)
ON CONFLICT DO NOTHING;

-- 7. Show sample products
SELECT 
    id,
    name,
    price,
    is_active,
    created_at
FROM products 
ORDER BY created_at DESC 
LIMIT 5;

-- Success message
SELECT 'Database schema updated successfully! available_quantity removed, is_active used for availability.' as status; 