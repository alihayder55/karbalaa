-- إصلاح سريع للبحث والفئات
-- شغل هذا في Supabase SQL Editor

-- 1. إنشاء جدول الفئات
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إنشاء جدول المنتجات (بدون unit)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_price DECIMAL(10,2),
    image_url TEXT,
    available_quantity INTEGER DEFAULT 0,
    category_id UUID REFERENCES product_categories(id),
    merchant_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. إدراج فئات تجريبية
INSERT INTO product_categories (name, name_ar, description) VALUES 
    ('Food', 'طعام ومشروبات', 'مواد غذائية ومشروبات'),
    ('Grocery', 'بقالة', 'احتياجات المنزل والبقالة'),
    ('Electronics', 'إلكترونيات', 'أجهزة إلكترونية ومعدات تقنية'),
    ('Clothing', 'ملابس', 'ملابس وأزياء للرجال والنساء')
ON CONFLICT DO NOTHING;

-- 4. إدراج منتجات تجريبية
DO $$
DECLARE
    food_id UUID;
    grocery_id UUID;
    electronics_id UUID;
    clothing_id UUID;
BEGIN
    -- الحصول على معرفات الفئات
    SELECT id INTO food_id FROM product_categories WHERE name = 'Food' LIMIT 1;
    SELECT id INTO grocery_id FROM product_categories WHERE name = 'Grocery' LIMIT 1;
    SELECT id INTO electronics_id FROM product_categories WHERE name = 'Electronics' LIMIT 1;
    SELECT id INTO clothing_id FROM product_categories WHERE name = 'Clothing' LIMIT 1;
    
    -- منتجات الطعام
    IF food_id IS NOT NULL THEN
        INSERT INTO products (name, description, price, discount_price, available_quantity, category_id) VALUES
            ('أرز بسمتي', 'أرز بسمتي عالي الجودة', 15000, 13500, 100, food_id),
            ('زيت زيتون', 'زيت زيتون بكر ممتاز', 25000, NULL, 50, food_id),
            ('طماطم طازجة', 'طماطم طازجة محلية', 3000, 2500, 200, food_id),
            ('صدر دجاج', 'صدر دجاج طازج', 12000, 11000, 30, food_id),
            ('خبز طازج', 'خبز طازج يومياً', 1500, NULL, 80, food_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- منتجات البقالة
    IF grocery_id IS NOT NULL THEN
        INSERT INTO products (name, description, price, available_quantity, category_id) VALUES
            ('سكر أبيض', 'سكر أبيض مكرر', 4000, 60, grocery_id),
            ('ملح طعام', 'ملح طعام يودي', 1000, 100, grocery_id),
            ('شاي أسود', 'شاي أسود فاخر', 8000, 45, grocery_id),
            ('مسحوق غسيل', 'مسحوق غسيل قوي', 6000, 25, grocery_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- منتجات إلكترونية
    IF electronics_id IS NOT NULL THEN
        INSERT INTO products (name, description, price, discount_price, available_quantity, category_id) VALUES
            ('هاتف ذكي', 'هاتف ذكي بمواصفات عالية', 450000, 400000, 15, electronics_id),
            ('سماعات رأس', 'سماعات رأس لاسلكية', 75000, 65000, 30, electronics_id),
            ('بطارية محمولة', 'بطارية محمولة سعة كبيرة', 35000, NULL, 40, electronics_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- ملابس
    IF clothing_id IS NOT NULL THEN
        INSERT INTO products (name, description, price, discount_price, available_quantity, category_id) VALUES
            ('تيشيرت', 'تيشيرت قطني مريح', 25000, 20000, 50, clothing_id),
            ('بنطال جينز', 'بنطال جينز عصري', 45000, NULL, 25, clothing_id),
            ('حذاء رياضي', 'حذاء رياضي مريح', 85000, 75000, 20, clothing_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 5. إنشاء جدول المفضلة
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 6. تعيين الصلاحيات
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON product_categories TO anon, authenticated;
GRANT ALL ON products TO anon, authenticated;
GRANT ALL ON user_favorites TO anon, authenticated;

-- 7. إعداد سياسات RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- سياسات للفئات
DROP POLICY IF EXISTS "Allow read categories" ON product_categories;
CREATE POLICY "Allow read categories" ON product_categories 
    FOR SELECT USING (is_active = true);

-- سياسات للمنتجات
DROP POLICY IF EXISTS "Allow read products" ON products;
CREATE POLICY "Allow read products" ON products 
    FOR SELECT USING (is_active = true);

-- سياسات للمفضلة
DROP POLICY IF EXISTS "Allow all favorites" ON user_favorites;
CREATE POLICY "Allow all favorites" ON user_favorites 
    FOR ALL USING (true);

-- 8. إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);

-- 9. اختبار النظام
SELECT 
    'تم إعداد النظام بنجاح!' as status,
    (SELECT COUNT(*) FROM product_categories WHERE is_active = true) as categories_count,
    (SELECT COUNT(*) FROM products WHERE is_active = true) as products_count; 