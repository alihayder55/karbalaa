-- Fix Missing Columns and Tables for Walcard App
-- This script adds missing columns and ensures database compatibility

-- Add missing delivery_address column to orders table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' 
                   AND column_name = 'delivery_address') THEN
        ALTER TABLE orders ADD COLUMN delivery_address TEXT;
        RAISE NOTICE 'Added delivery_address column to orders table';
    ELSE
        RAISE NOTICE 'delivery_address column already exists in orders table';
    END IF;
END $$;

-- Ensure orders table exists with all required columns
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    store_owner_id UUID,
    merchant_id UUID,
    status TEXT DEFAULT 'pending',
    total_price NUMERIC(12, 2) NOT NULL,
    delivery_address TEXT,
    delivery_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure products table exists
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID,
    category_id UUID,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    discount_price NUMERIC(12, 2),
    image_url TEXT,
    available_quantity INT DEFAULT 0,
    unit TEXT DEFAULT 'unit',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure product_categories table exists
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    name_ar TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure news table exists
CREATE TABLE IF NOT EXISTS news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    news_lable TEXT NOT NULL,
    news_label_ar TEXT,
    description TEXT,
    description_ar TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure order_items table exists
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID,
    product_id UUID,
    quantity INT NOT NULL,
    price_at_order NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing name_ar column to product_categories if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'product_categories' 
                   AND column_name = 'name_ar') THEN
        ALTER TABLE product_categories ADD COLUMN name_ar TEXT;
        RAISE NOTICE 'Added name_ar column to product_categories table';
    ELSE
        RAISE NOTICE 'name_ar column already exists in product_categories table';
    END IF;
END $$;

-- Add missing name_ar column to products if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'name_ar') THEN
        ALTER TABLE products ADD COLUMN name_ar TEXT;
        RAISE NOTICE 'Added name_ar column to products table';
    ELSE
        RAISE NOTICE 'name_ar column already exists in products table';
    END IF;
END $$;

-- Add missing unit column to products if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'unit') THEN
        ALTER TABLE products ADD COLUMN unit TEXT DEFAULT 'unit';
        RAISE NOTICE 'Added unit column to products table';
    ELSE
        RAISE NOTICE 'unit column already exists in products table';
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view related orders') THEN
        CREATE POLICY "Users can view related orders" ON orders
            FOR SELECT USING (
                user_id = auth.uid() OR 
                store_owner_id = auth.uid() OR 
                merchant_id = auth.uid()
            );
        RAISE NOTICE 'Created RLS policy for orders table';
    END IF;
END $$;

-- Create RLS policies for products
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active products') THEN
        CREATE POLICY "Public can view active products" ON products
            FOR SELECT USING (is_active = true);
        RAISE NOTICE 'Created RLS policy for products table';
    END IF;
END $$;

-- Create RLS policies for product_categories
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active categories') THEN
        CREATE POLICY "Public can view active categories" ON product_categories
            FOR SELECT USING (is_active = true);
        RAISE NOTICE 'Created RLS policy for product_categories table';
    END IF;
END $$;

-- Create RLS policies for news
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active news') THEN
        CREATE POLICY "Public can view active news" ON news
            FOR SELECT USING (is_active = true);
        RAISE NOTICE 'Created RLS policy for news table';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_owner_id ON orders(store_owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);
CREATE INDEX IF NOT EXISTS idx_product_categories_is_active ON product_categories(is_active);

-- Insert default categories if table is empty
INSERT INTO product_categories (name, name_ar, description) VALUES
    ('groceries', 'مواد غذائية', 'مواد غذائية أساسية'),
    ('fresh_produce', 'خضروات وفواكه', 'خضروات وفواكه طازجة'),
    ('dairy_products', 'منتجات الألبان', 'منتجات الألبان'),
    ('meat_poultry', 'لحوم ودواجن', 'لحوم ودواجن'),
    ('beverages', 'مشروبات', 'مشروبات'),
    ('household', 'منتجات منزلية', 'منتجات منزلية'),
    ('personal_care', 'العناية الشخصية', 'العناية الشخصية'),
    ('electronics', 'إلكترونيات', 'إلكترونيات'),
    ('clothing', 'ملابس', 'ملابس'),
    ('pharmacy', 'أدوية ومستلزمات طبية', 'أدوية ومستلزمات طبية')
ON CONFLICT (name) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description;

-- Insert sample news if table is empty
INSERT INTO news (news_lable, news_label_ar, description, description_ar) VALUES
    ('Welcome to Walcard', 'أهلاً بكم في ولكارد', 'Connecting store owners with merchants', 'منصة ولكارد لربط أصحاب المتاجر بالتجار'),
    ('Special Discounts', 'خصومات خاصة', 'Get exclusive discounts on products', 'احصل على خصومات حصرية على المنتجات'),
    ('New Products', 'منتجات جديدة', 'New products added to the platform', 'تم إضافة منتجات جديدة للمنصة')
ON CONFLICT (news_lable) DO UPDATE SET
    news_label_ar = EXCLUDED.news_label_ar,
    description = EXCLUDED.description,
    description_ar = EXCLUDED.description_ar;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON orders TO anon, authenticated;
GRANT ALL ON products TO anon, authenticated;
GRANT ALL ON product_categories TO anon, authenticated;
GRANT ALL ON news TO anon, authenticated;
GRANT ALL ON order_items TO anon, authenticated;

RAISE NOTICE 'Database schema fixes completed successfully!'; 