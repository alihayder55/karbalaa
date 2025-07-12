-- سكريبت شامل لإصلاح مشاكل البحث والفئات
-- قم بتشغيل هذا في Supabase SQL Editor

-- 1. إنشاء جدول الفئات مع البيانات المناسبة
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إنشاء جدول المنتجات مع الأعمدة المطلوبة
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_price DECIMAL(10,2),
    image_url TEXT,
    available_quantity INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'قطعة',
    category_id UUID REFERENCES product_categories(id),
    merchant_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. إدراج فئات تجريبية
INSERT INTO product_categories (name, name_ar, description, icon) VALUES 
    ('Food & Beverages', 'طعام ومشروبات', 'مواد غذائية ومشروبات متنوعة', 'restaurant'),
    ('Grocery', 'بقالة', 'احتياجات المنزل والبقالة', 'local-grocery-store'),
    ('Electronics', 'إلكترونيات', 'أجهزة إلكترونية ومعدات تقنية', 'phone-android'),
    ('Clothing', 'ملابس', 'ملابس وأزياء للرجال والنساء', 'checkroom'),
    ('Health & Beauty', 'صحة وجمال', 'منتجات العناية والجمال', 'favorite'),
    ('Home & Garden', 'منزل وحديقة', 'أدوات منزلية ومستلزمات الحديقة', 'home')
ON CONFLICT (id) DO NOTHING;

-- 4. إدراج منتجات تجريبية
DO $$
DECLARE
    food_cat_id UUID;
    grocery_cat_id UUID;
    electronics_cat_id UUID;
    clothing_cat_id UUID;
    health_cat_id UUID;
    home_cat_id UUID;
BEGIN
    -- الحصول على معرفات الفئات
    SELECT id INTO food_cat_id FROM product_categories WHERE name = 'Food & Beverages' LIMIT 1;
    SELECT id INTO grocery_cat_id FROM product_categories WHERE name = 'Grocery' LIMIT 1;
    SELECT id INTO electronics_cat_id FROM product_categories WHERE name = 'Electronics' LIMIT 1;
    SELECT id INTO clothing_cat_id FROM product_categories WHERE name = 'Clothing' LIMIT 1;
    SELECT id INTO health_cat_id FROM product_categories WHERE name = 'Health & Beauty' LIMIT 1;
    SELECT id INTO home_cat_id FROM product_categories WHERE name = 'Home & Garden' LIMIT 1;

    -- إدراج منتجات الطعام والمشروبات
    IF food_cat_id IS NOT NULL THEN
        INSERT INTO products (name, name_ar, description, price, discount_price, available_quantity, unit, category_id) VALUES
            ('Basmati Rice', 'أرز بسمتي', 'أرز بسمتي عالي الجودة', 15000, 13500, 100, 'كيس', food_cat_id),
            ('Olive Oil', 'زيت زيتون', 'زيت زيتون بكر ممتاز', 25000, NULL, 50, 'زجاجة', food_cat_id),
            ('Fresh Tomatoes', 'طماطم طازجة', 'طماطم طازجة محلية', 3000, 2500, 200, 'كيلو', food_cat_id),
            ('Chicken Breast', 'صدر دجاج', 'صدر دجاج طازج', 12000, 11000, 30, 'كيلو', food_cat_id),
            ('Fresh Bread', 'خبز طازج', 'خبز طازج يومياً', 1500, NULL, 80, 'رغيف', food_cat_id)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- إدراج منتجات البقالة
    IF grocery_cat_id IS NOT NULL THEN
        INSERT INTO products (name, name_ar, description, price, available_quantity, unit, category_id) VALUES
            ('Sugar', 'سكر أبيض', 'سكر أبيض مكرر', 4000, 60, 'كيس', grocery_cat_id),
            ('Salt', 'ملح طعام', 'ملح طعام يودي', 1000, 100, 'علبة', grocery_cat_id),
            ('Black Tea', 'شاي أسود', 'شاي أسود فاخر', 8000, 45, 'علبة', grocery_cat_id),
            ('Washing Powder', 'مسحوق غسيل', 'مسحوق غسيل قوي', 6000, 25, 'علبة', grocery_cat_id)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- إدراج منتجات إلكترونية
    IF electronics_cat_id IS NOT NULL THEN
        INSERT INTO products (name, name_ar, description, price, discount_price, available_quantity, unit, category_id) VALUES
            ('Smartphone', 'هاتف ذكي', 'هاتف ذكي بمواصفات عالية', 450000, 400000, 15, 'جهاز', electronics_cat_id),
            ('Headphones', 'سماعات رأس', 'سماعات رأس لاسلكية', 75000, 65000, 30, 'جهاز', electronics_cat_id),
            ('Power Bank', 'بطارية محمولة', 'بطارية محمولة سعة كبيرة', 35000, NULL, 40, 'جهاز', electronics_cat_id)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- إدراج ملابس
    IF clothing_cat_id IS NOT NULL THEN
        INSERT INTO products (name, name_ar, description, price, discount_price, available_quantity, unit, category_id) VALUES
            ('T-Shirt', 'تيشيرت', 'تيشيرت قطني مريح', 25000, 20000, 50, 'قطعة', clothing_cat_id),
            ('Jeans', 'بنطال جينز', 'بنطال جينز عصري', 45000, NULL, 25, 'قطعة', clothing_cat_id),
            ('Sneakers', 'حذاء رياضي', 'حذاء رياضي مريح', 85000, 75000, 20, 'زوج', clothing_cat_id)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- إدراج منتجات الصحة والجمال
    IF health_cat_id IS NOT NULL THEN
        INSERT INTO products (name, name_ar, description, price, available_quantity, unit, category_id) VALUES
            ('Shampoo', 'شامبو', 'شامبو للشعر الجاف', 18000, 35, 'زجاجة', health_cat_id),
            ('Face Cream', 'كريم وجه', 'كريم مرطب للوجه', 28000, 25, 'علبة', health_cat_id),
            ('Toothpaste', 'معجون أسنان', 'معجون أسنان بالنعناع', 5000, 60, 'أنبوب', health_cat_id)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- إدراج منتجات المنزل والحديقة
    IF home_cat_id IS NOT NULL THEN
        INSERT INTO products (name, name_ar, description, price, discount_price, available_quantity, unit, category_id) VALUES
            ('Plates Set', 'طقم صحون', 'طقم صحون من 6 قطع', 35000, 30000, 15, 'طقم', home_cat_id),
            ('Garden Tools', 'أدوات حديقة', 'مجموعة أدوات العناية بالحديقة', 55000, NULL, 10, 'مجموعة', home_cat_id),
            ('Kitchen Knife', 'سكين مطبخ', 'سكين مطبخ حاد', 15000, 12000, 30, 'قطعة', home_cat_id)
        ON CONFLICT (id) DO NOTHING;
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
CREATE INDEX IF NOT EXISTS idx_products_name_ar ON products(name_ar);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product ON user_favorites(product_id);

-- 9. تحديث timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق trigger على الجداول
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON product_categories;
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON product_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. اختبار النظام
DO $$
DECLARE
    cat_count INTEGER;
    prod_count INTEGER;
    result_message TEXT;
BEGIN
    SELECT COUNT(*) INTO cat_count FROM product_categories WHERE is_active = true;
    SELECT COUNT(*) INTO prod_count FROM products WHERE is_active = true;
    
    result_message := format('✅ تم إعداد النظام بنجاح! %s فئة و %s منتج', cat_count, prod_count);
    RAISE NOTICE '%', result_message;
END $$;

SELECT 
    'تم إعداد نظام البحث والفئات بنجاح!' as status,
    (SELECT COUNT(*) FROM product_categories WHERE is_active = true) as categories_count,
    (SELECT COUNT(*) FROM products WHERE is_active = true) as products_count,
    (SELECT COUNT(*) FROM user_favorites) as favorites_count; 