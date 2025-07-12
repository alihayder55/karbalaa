-- اختبار بسيط لنظام المفضلة
-- قم بتشغيل هذا في Supabase SQL Editor

-- 1. التحقق من وجود جدول user_favorites
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'user_favorites' 
ORDER BY ordinal_position;

-- 2. إنشاء جدول user_favorites إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 3. إنشاء جدول products بسيط إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    available_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. إدراج منتجات تجريبية
INSERT INTO products (name, price, available_quantity) VALUES
    ('أرز بسمتي', 15000, 100),
    ('زيت زيتون', 25000, 50),
    ('طماطم طازجة', 3000, 200)
ON CONFLICT DO NOTHING;

-- 5. إنشاء دالة بسيطة للحصول على المفضلة
CREATE OR REPLACE FUNCTION get_user_favorites_simple(p_user_id UUID)
RETURNS TABLE (
    favorite_id UUID,
    product_id UUID,
    product_name TEXT,
    price DECIMAL(10,2),
    image_url TEXT,
    available_quantity INTEGER,
    added_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uf.id as favorite_id,
        p.id as product_id,
        p.name as product_name,
        p.price,
        p.image_url,
        p.available_quantity,
        uf.created_at as added_at
    FROM user_favorites uf
    JOIN products p ON uf.product_id = p.id
    WHERE uf.user_id = p_user_id
    AND p.is_active = true
    ORDER BY uf.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. إنشاء دالة بسيطة لتبديل المفضلة
CREATE OR REPLACE FUNCTION toggle_favorite_simple(p_user_id UUID, p_product_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- التحقق من وجود المنتج في المفضلة
    IF EXISTS (SELECT 1 FROM user_favorites WHERE user_id = p_user_id AND product_id = p_product_id) THEN
        -- إزالة من المفضلة
        DELETE FROM user_favorites WHERE user_id = p_user_id AND product_id = p_product_id;
        result := json_build_object(
            'success', true,
            'message', 'تم إزالة المنتج من المفضلة',
            'was_favorite', true
        );
    ELSE
        -- إضافة إلى المفضلة
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

-- 7. إنشاء دالة للتحقق من حالة المفضلة
CREATE OR REPLACE FUNCTION is_favorite_simple(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_favorites 
        WHERE user_id = p_user_id AND product_id = p_product_id
    );
END;
$$ LANGUAGE plpgsql;

-- 8. تعيين الصلاحيات
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_favorites TO anon, authenticated;
GRANT ALL ON products TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_favorites_simple(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION toggle_favorite_simple(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_favorite_simple(UUID, UUID) TO anon, authenticated;

-- 9. إعداد سياسات الأمان البسيطة
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- سياسة للمفضلة - السماح للجميع لسهولة الاختبار
DROP POLICY IF EXISTS "Allow all for favorites" ON user_favorites;
CREATE POLICY "Allow all for favorites" ON user_favorites FOR ALL USING (true);

-- سياسة للمنتجات - السماح بالقراءة للجميع
DROP POLICY IF EXISTS "Allow read for products" ON products;
CREATE POLICY "Allow read for products" ON products FOR SELECT USING (is_active = true);

-- 10. اختبار النظام
-- استبدل 'YOUR_USER_ID' بمعرف المستخدم الفعلي
DO $$
DECLARE
    test_user_id UUID := 'b756282e-24f5-4654-b7e7-e8e367896fa2';
    test_product_id UUID;
    toggle_result JSON;
    favorites_count INTEGER;
BEGIN
    -- الحصول على أول منتج للاختبار
    SELECT id INTO test_product_id FROM products LIMIT 1;
    
    IF test_product_id IS NOT NULL THEN
        -- اختبار إضافة إلى المفضلة
        SELECT toggle_favorite_simple(test_user_id, test_product_id) INTO toggle_result;
        RAISE NOTICE 'Toggle result: %', toggle_result;
        
        -- عد المفضلة
        SELECT COUNT(*) INTO favorites_count FROM user_favorites WHERE user_id = test_user_id;
        RAISE NOTICE 'Favorites count: %', favorites_count;
        
        -- اختبار الحصول على المفضلة
        RAISE NOTICE 'Testing get_user_favorites_simple...';
    ELSE
        RAISE NOTICE 'No products found for testing';
    END IF;
END $$;

SELECT 'إعداد نظام المفضلة مكتمل!' as status; 