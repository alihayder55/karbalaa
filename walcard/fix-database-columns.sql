-- Fix database column issues and function problems

-- 1. Add missing name_ar column to product_categories table
ALTER TABLE product_categories 
ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);

-- Update existing categories with Arabic names
UPDATE product_categories 
SET name_ar = CASE 
    WHEN name = 'Restaurants' THEN 'مطاعم'
    WHEN name = 'Grocery' THEN 'بقالة'
    WHEN name = 'Clothing' THEN 'ملابس'
    WHEN name = 'Electronics' THEN 'إلكترونيات'
    WHEN name = 'Home & Garden' THEN 'المنزل والحديقة'
    WHEN name = 'Sports' THEN 'رياضة'
    ELSE name
END
WHERE name_ar IS NULL;

-- 2. Fix the get_user_favorites function to handle missing name_ar column
CREATE OR REPLACE FUNCTION get_user_favorites(p_user_id UUID)
RETURNS TABLE (
    favorite_id UUID,
    product_id UUID,
    product_name VARCHAR,
    product_name_ar VARCHAR,
    product_description TEXT,
    price DECIMAL(10,2),
    discount_price DECIMAL(10,2),
    image_url TEXT,
    available_quantity INTEGER,
    category_name VARCHAR,
    category_name_ar VARCHAR,
    merchant_id UUID,
    added_at TIMESTAMP
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

-- 3. Fix the add_to_favorites function
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
        INSERT INTO user_favorites (user_id, product_id, created_at)
        VALUES (p_user_id, p_product_id, NOW());
        
        result := json_build_object(
            'success', true,
            'message', 'تم إضافة المنتج إلى المفضلة',
            'already_favorite', false
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 4. Fix the remove_from_favorites function
CREATE OR REPLACE FUNCTION remove_from_favorites(p_user_id UUID, p_product_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if in favorites
    IF EXISTS (SELECT 1 FROM user_favorites WHERE user_id = p_user_id AND product_id = p_product_id) THEN
        -- Remove from favorites
        DELETE FROM user_favorites 
        WHERE user_id = p_user_id AND product_id = p_product_id;
        
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

-- 5. Fix the toggle_favorite function
CREATE OR REPLACE FUNCTION toggle_favorite(p_user_id UUID, p_product_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if already in favorites
    IF EXISTS (SELECT 1 FROM user_favorites WHERE user_id = p_user_id AND product_id = p_product_id) THEN
        -- Remove from favorites
        DELETE FROM user_favorites 
        WHERE user_id = p_user_id AND product_id = p_product_id;
        
        result := json_build_object(
            'success', true,
            'message', 'تم إزالة المنتج من المفضلة',
            'was_favorite', true
        );
    ELSE
        -- Add to favorites
        INSERT INTO user_favorites (user_id, product_id, created_at)
        VALUES (p_user_id, p_product_id, NOW());
        
        result := json_build_object(
            'success', true,
            'message', 'تم إضافة المنتج إلى المفضلة',
            'was_favorite', false
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. Fix the is_product_favorite function
CREATE OR REPLACE FUNCTION is_product_favorite(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_favorites 
        WHERE user_id = p_user_id AND product_id = p_product_id
    );
END;
$$ LANGUAGE plpgsql;

-- 7. Add missing name_ar column to products table if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);

-- Update existing products with Arabic names (placeholder)
UPDATE products 
SET name_ar = name
WHERE name_ar IS NULL;

-- 8. Ensure all necessary indexes exist
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON user_favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- 9. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_favorites(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION add_to_favorites(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION remove_from_favorites(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION toggle_favorite(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_product_favorite(UUID, UUID) TO anon, authenticated;

-- 10. Update RLS policies if needed
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Policy for user_favorites
DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
CREATE POLICY "Users can view their own favorites" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favorites" ON user_favorites;
CREATE POLICY "Users can insert their own favorites" ON user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;
CREATE POLICY "Users can delete their own favorites" ON user_favorites
    FOR DELETE USING (auth.uid() = user_id); 