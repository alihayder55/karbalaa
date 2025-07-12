-- إنشاء الفئات في قاعدة البيانات
-- شغل هذا في Supabase SQL Editor

-- 1. التأكد من وجود جدول الفئات
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. مسح الفئات القديمة إذا كانت موجودة
DELETE FROM product_categories;

-- 3. إدراج الفئات الجديدة
INSERT INTO product_categories (name, description) VALUES 
    ('طعام ومشروبات', 'مواد غذائية ومشروبات متنوعة وطازجة'),
    ('بقالة', 'احتياجات المنزل والبقالة الأساسية'),
    ('إلكترونيات', 'أجهزة إلكترونية ومعدات تقنية حديثة'),
    ('ملابس', 'ملابس وأزياء للرجال والنساء والأطفال'),
    ('صحة وجمال', 'منتجات العناية الشخصية والجمال'),
    ('منزل وحديقة', 'أدوات منزلية ومستلزمات الحديقة'),
    ('رياضة', 'معدات رياضية وأدوات اللياقة البدنية'),
    ('كتب وقرطاسية', 'كتب ومستلزمات مكتبية وقرطاسية');

-- 4. تعيين الصلاحيات
GRANT ALL ON product_categories TO anon, authenticated;

-- 5. إعداد سياسات الأمان
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read categories" ON product_categories;
CREATE POLICY "Allow read categories" ON product_categories 
    FOR SELECT USING (is_active = true);

-- 6. التحقق من النتائج
SELECT 
    id,
    name,
    description,
    is_active,
    created_at
FROM product_categories 
WHERE is_active = true 
ORDER BY name;

-- 7. عرض النتيجة النهائية
SELECT 
    COUNT(*) as total_categories,
    'تم إنشاء الفئات بنجاح!' as status
FROM product_categories 
WHERE is_active = true; 