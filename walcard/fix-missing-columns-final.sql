-- Comprehensive Database Fix - Add Missing Columns
-- Run this in Supabase SQL Editor

-- 1. Check current products table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 2. Remove available_quantity if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'available_quantity'
    ) THEN
        ALTER TABLE products DROP COLUMN available_quantity;
        RAISE NOTICE 'Removed available_quantity column';
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
        RAISE NOTICE 'Added is_active column';
    END IF;
END $$;

-- 4. Add name_ar column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'name_ar'
    ) THEN
        ALTER TABLE products ADD COLUMN name_ar TEXT;
        RAISE NOTICE 'Added name_ar column';
    END IF;
END $$;

-- 5. Add description_ar column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'description_ar'
    ) THEN
        ALTER TABLE products ADD COLUMN description_ar TEXT;
        RAISE NOTICE 'Added description_ar column';
    END IF;
END $$;

-- 6. Add unit column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'unit'
    ) THEN
        ALTER TABLE products ADD COLUMN unit TEXT DEFAULT 'unit';
        RAISE NOTICE 'Added unit column';
    END IF;
END $$;

-- 7. Update existing products
UPDATE products 
SET is_active = true 
WHERE is_active IS NULL;

-- 8. Insert sample products for testing
INSERT INTO products (
    name,
    name_ar,
    description,
    description_ar,
    price,
    discount_price,
    image_url,
    is_active,
    unit,
    category_id,
    merchant_id
) VALUES 
(
    'Test Product 1',
    'منتج تجريبي 1',
    'Test product description',
    'وصف المنتج التجريبي الأول',
    100000,
    80000,
    'https://example.com/image1.jpg',
    true,
    'piece',
    NULL,
    NULL
),
(
    'Test Product 2',
    'منتج تجريبي 2',
    'Test product description 2',
    'وصف المنتج التجريبي الثاني',
    150000,
    NULL,
    'https://example.com/image2.jpg',
    true,
    'piece',
    NULL,
    NULL
),
(
    'Unavailable Product',
    'منتج غير متوفر',
    'Unavailable product for testing',
    'منتج غير متوفر للاختبار',
    200000,
    NULL,
    'https://example.com/image3.jpg',
    false,
    'piece',
    NULL,
    NULL
)
ON CONFLICT DO NOTHING;

-- 9. Show final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 10. Show sample products
SELECT 
    id,
    name,
    name_ar,
    price,
    is_active,
    unit,
    created_at
FROM products 
ORDER BY created_at DESC 
LIMIT 5;

-- Success message
SELECT 'Database schema updated successfully! All required columns are now available.' as status; 