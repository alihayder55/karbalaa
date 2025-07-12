-- Minimal Database Fix for Walcard App
-- This script creates the minimum required structure for the app to work

-- 1. Create product_categories table if it doesn't exist with minimal structure
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add name_ar and is_active columns if they don't exist
DO $$
BEGIN
    -- Add name_ar column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_categories' AND column_name = 'name_ar'
    ) THEN
        ALTER TABLE product_categories ADD COLUMN name_ar TEXT;
    END IF;
    
    -- Add is_active column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_categories' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE product_categories ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 3. Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    discount_price NUMERIC(12, 2),
    image_url TEXT,
    available_quantity INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'unit',
    category_id UUID REFERENCES product_categories(id),
    merchant_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add name_ar column to products if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'name_ar'
    ) THEN
        ALTER TABLE products ADD COLUMN name_ar TEXT;
    END IF;
END $$;

-- 5. Create user_favorites table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 6. Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    store_owner_id UUID,
    merchant_id UUID,
    status TEXT DEFAULT 'pending',
    total_price NUMERIC(12, 2) NOT NULL,
    order_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price_at_order NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create news table if it doesn't exist
CREATE TABLE IF NOT EXISTS news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Insert default categories
INSERT INTO product_categories (name, name_ar, description, is_active) VALUES
    ('groceries', 'مواد غذائية', 'Basic grocery items', true),
    ('fresh_produce', 'خضروات وفواكه', 'Fresh vegetables and fruits', true),
    ('dairy_products', 'منتجات الألبان', 'Dairy products', true),
    ('meat_poultry', 'لحوم ودواجن', 'Meat and poultry', true),
    ('beverages', 'مشروبات', 'Beverages and drinks', true),
    ('household', 'منتجات منزلية', 'Household products', true),
    ('personal_care', 'العناية الشخصية', 'Personal care items', true),
    ('electronics', 'إلكترونيات', 'Electronic devices', true)
ON CONFLICT (name) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- 10. Insert sample products
INSERT INTO products (name, name_ar, description, price, discount_price, available_quantity, category_id) VALUES
    (
        'Premium Rice',
        'أرز بريميوم',
        'High quality basmati rice',
        15000,
        12000,
        100,
        (SELECT id FROM product_categories WHERE name = 'groceries' LIMIT 1)
    ),
    (
        'Olive Oil',
        'زيت زيتون',
        'Extra virgin olive oil',
        25000,
        NULL,
        50,
        (SELECT id FROM product_categories WHERE name = 'groceries' LIMIT 1)
    ),
    (
        'Fresh Tomatoes',
        'طماطم طازجة',
        'Fresh red tomatoes',
        3000,
        2500,
        200,
        (SELECT id FROM product_categories WHERE name = 'fresh_produce' LIMIT 1)
    )
ON CONFLICT DO NOTHING;

-- 11. Insert sample news
INSERT INTO news (title, content) VALUES
    ('Welcome to Walcard', 'منصة ولكارد لربط أصحاب المتاجر بالتجار'),
    ('Special Offers', 'عروض خاصة على المنتجات المختارة'),
    ('New Products Added', 'تم إضافة منتجات جديدة للمنصة')
ON CONFLICT DO NOTHING;

-- 12. Create simplified favorites functions
CREATE OR REPLACE FUNCTION get_user_favorites(p_user_id UUID)
RETURNS TABLE (
    favorite_id UUID,
    product_id UUID,
    product_name TEXT,
    product_name_ar TEXT,
    product_description TEXT,
    price NUMERIC(12,2),
    discount_price NUMERIC(12,2),
    image_url TEXT,
    available_quantity INTEGER,
    category_name TEXT,
    category_name_ar TEXT,
    merchant_id UUID,
    added_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uf.id as favorite_id,
        p.id as product_id,
        p.name as product_name,
        COALESCE(p.name_ar, p.name) as product_name_ar,
        p.description as product_description,
        p.price,
        p.discount_price,
        p.image_url,
        p.available_quantity,
        pc.name as category_name,
        COALESCE(pc.name_ar, pc.name) as category_name_ar,
        p.merchant_id,
        uf.created_at as added_at
    FROM user_favorites uf
    JOIN products p ON uf.product_id = p.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE uf.user_id = p_user_id
    AND p.is_active = true
    ORDER BY uf.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 13. Create toggle_favorite function
CREATE OR REPLACE FUNCTION toggle_favorite(p_user_id UUID, p_product_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if already in favorites
    IF EXISTS (SELECT 1 FROM user_favorites WHERE user_id = p_user_id AND product_id = p_product_id) THEN
        -- Remove from favorites
        DELETE FROM user_favorites WHERE user_id = p_user_id AND product_id = p_product_id;
        result := json_build_object(
            'success', true,
            'message', 'تم إزالة المنتج من المفضلة',
            'was_favorite', true
        );
    ELSE
        -- Add to favorites
        INSERT INTO user_favorites (user_id, product_id) VALUES (p_user_id, p_product_id);
        result := json_build_object(
            'success', true,
            'message', 'تم إضافة المنتج إلى المفضلة',
            'was_favorite', false
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 14. Create is_product_favorite function
CREATE OR REPLACE FUNCTION is_product_favorite(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_favorites 
        WHERE user_id = p_user_id AND product_id = p_product_id
    );
END;
$$ LANGUAGE plpgsql;

-- 15. Create add_to_favorites function
CREATE OR REPLACE FUNCTION add_to_favorites(p_user_id UUID, p_product_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if already in favorites
    IF EXISTS (SELECT 1 FROM user_favorites WHERE user_id = p_user_id AND product_id = p_product_id) THEN
        result := json_build_object(
            'success', false,
            'message', 'المنتج موجود بالفعل في المفضلة',
            'already_favorite', true
        );
    ELSE
        -- Add to favorites
        INSERT INTO user_favorites (user_id, product_id) VALUES (p_user_id, p_product_id);
        result := json_build_object(
            'success', true,
            'message', 'تم إضافة المنتج إلى المفضلة',
            'already_favorite', false
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 16. Create remove_from_favorites function
CREATE OR REPLACE FUNCTION remove_from_favorites(p_user_id UUID, p_product_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if in favorites
    IF EXISTS (SELECT 1 FROM user_favorites WHERE user_id = p_user_id AND product_id = p_product_id) THEN
        -- Remove from favorites
        DELETE FROM user_favorites WHERE user_id = p_user_id AND product_id = p_product_id;
        result := json_build_object(
            'success', true,
            'message', 'تم إزالة المنتج من المفضلة',
            'was_favorite', true
        );
    ELSE
        result := json_build_object(
            'success', false,
            'message', 'المنتج غير موجود في المفضلة',
            'was_favorite', false
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 17. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON user_favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_owner_id ON orders(store_owner_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 18. Enable RLS and create policies
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for user_favorites (allow all for now to test)
DROP POLICY IF EXISTS "Allow all for user_favorites" ON user_favorites;
CREATE POLICY "Allow all for user_favorites" ON user_favorites FOR ALL USING (true);

-- Policies for products (public read access)
DROP POLICY IF EXISTS "Allow read for products" ON products;
CREATE POLICY "Allow read for products" ON products FOR SELECT USING (is_active = true);

-- Policies for orders (users can see their own orders)
DROP POLICY IF EXISTS "Allow all for orders" ON orders;
CREATE POLICY "Allow all for orders" ON orders FOR ALL USING (true);

-- Policies for order_items
DROP POLICY IF EXISTS "Allow all for order_items" ON order_items;
CREATE POLICY "Allow all for order_items" ON order_items FOR ALL USING (true);

-- 19. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'Database setup completed successfully!' as status; 