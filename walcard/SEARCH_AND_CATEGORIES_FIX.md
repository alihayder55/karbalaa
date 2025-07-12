# حل مشاكل البحث والفئات - دليل شامل

## المشاكل المحددة:
1. **البحث لا يعمل** - لا تظهر نتائج عند البحث عن المنتجات
2. **الفئات لا تُظهر المنتجات** - عند النقر على فئة لا تظهر منتجاتها

## الأسباب الجذرية:
- عدم وجود بيانات كافية في قاعدة البيانات
- مشاكل في استعلامات البحث والفلترة
- عدم وجود ربط صحيح بين المنتجات والفئات

## الحل الكامل:

### 1. إصلاح قاعدة البيانات في Supabase
انتقل إلى **Supabase Dashboard > SQL Editor** وشغل هذا السكريبت:

```sql
-- إنشاء جدول الفئات
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول المنتجات
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إدراج فئات تجريبية
INSERT INTO product_categories (name, name_ar, description) VALUES 
    ('Food & Beverages', 'طعام ومشروبات', 'مواد غذائية ومشروبات'),
    ('Grocery', 'بقالة', 'احتياجات المنزل والبقالة'),
    ('Electronics', 'إلكترونيات', 'أجهزة إلكترونية ومعدات تقنية'),
    ('Clothing', 'ملابس', 'ملابس وأزياء')
ON CONFLICT (id) DO NOTHING;

-- إدراج منتجات تجريبية (مثال لفئة الطعام)
DO $$
DECLARE
    food_cat_id UUID;
BEGIN
    SELECT id INTO food_cat_id FROM product_categories WHERE name = 'Food & Beverages' LIMIT 1;
    
    IF food_cat_id IS NOT NULL THEN
        INSERT INTO products (name, name_ar, description, price, discount_price, available_quantity, category_id) VALUES
            ('Basmati Rice', 'أرز بسمتي', 'أرز بسمتي عالي الجودة', 15000, 13500, 100, food_cat_id),
            ('Olive Oil', 'زيت زيتون', 'زيت زيتون بكر ممتاز', 25000, NULL, 50, food_cat_id),
            ('Fresh Tomatoes', 'طماطم طازجة', 'طماطم طازجة محلية', 3000, 2500, 200, food_cat_id),
            ('Chicken Breast', 'صدر دجاج', 'صدر دجاج طازج', 12000, 11000, 30, food_cat_id)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- تعيين الصلاحيات
GRANT ALL ON product_categories TO anon, authenticated;
GRANT ALL ON products TO anon, authenticated;

-- إعداد سياسات الأمان
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read categories" ON product_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Allow read products" ON products FOR SELECT USING (is_active = true);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

SELECT 'تم إعداد البحث والفئات بنجاح!' as status;
```

### 2. التحقق من النتائج
بعد تشغيل السكريبت، تحقق من النتائج:

```sql
-- عرض الفئات
SELECT id, name, name_ar FROM product_categories WHERE is_active = true;

-- عرض المنتجات مع فئاتها
SELECT 
    p.name, 
    p.name_ar, 
    p.price, 
    c.name_ar as category_name 
FROM products p 
LEFT JOIN product_categories c ON p.category_id = c.id 
WHERE p.is_active = true;

-- عد المنتجات في كل فئة
SELECT 
    c.name_ar as category_name,
    COUNT(p.id) as products_count
FROM product_categories c
LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
WHERE c.is_active = true
GROUP BY c.id, c.name_ar;
```

### 3. اختبار التطبيق

#### أ. اختبار البحث:
1. افتح التطبيق واذهب إلى صفحة البحث
2. اكتب "أرز" أو "Rice" في مربع البحث
3. يجب أن ترى منتج الأرز في النتائج

#### ب. اختبار الفئات:
1. في صفحة البحث، انقر على فئة "طعام ومشروبات"
2. يجب أن ترى جميع منتجات الطعام
3. جرب فئات أخرى للتأكد من عملها

### 4. المميزات الجديدة في البحث:

#### ✅ البحث الذكي:
- البحث في أسماء المنتجات (عربي وإنجليزي)
- البحث في الوصف
- فلترة حسب الفئة

#### ✅ عرض الفئات:
- عند اختيار فئة، تظهر منتجاتها فوراً
- إمكانية البحث داخل فئة محددة
- عرض عدد المنتجات في كل فئة

#### ✅ تحسينات الأداء:
- فهارس قاعدة البيانات للبحث السريع
- تحديد عدد النتائج لتجنب البطء
- لوجينغ مفصل لتسهيل التشخيص

### 5. استكشاف الأخطاء:

#### إذا لم تظهر الفئات:
```sql
-- تحقق من وجود الفئات
SELECT COUNT(*) FROM product_categories WHERE is_active = true;
```

#### إذا لم تظهر المنتجات في الفئة:
```sql
-- تحقق من ربط المنتجات بالفئات
SELECT 
    c.name_ar,
    COUNT(p.id) as products_count
FROM product_categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id, c.name_ar;
```

#### إذا لم يعمل البحث:
- تحقق من console التطبيق للرسائل التشخيصية
- ابحث عن رسائل مثل "🔍 Searching for:" و "✅ Search results:"

### 6. إضافة منتجات جديدة:

لإضافة منتجات جديدة لفئة معينة:
```sql
-- الحصول على معرف الفئة
SELECT id FROM product_categories WHERE name_ar = 'بقالة';

-- إضافة منتج جديد
INSERT INTO products (name, name_ar, description, price, available_quantity, category_id) 
VALUES ('Sugar', 'سكر أبيض', 'سكر أبيض مكرر', 4000, 60, 'category-id-here');
```

### 7. نصائح مهمة:

1. **أعد تشغيل التطبيق** بعد تشغيل السكريبت:
   ```bash
   npx expo start --clear
   ```

2. **تحقق من اتصال الإنترنت** - التطبيق يحتاج اتصال لقاعدة البيانات

3. **راقب console** للرسائل التشخيصية أثناء الاختبار

4. **استخدم البيانات التجريبية** لاختبار الوظائف قبل إضافة بيانات حقيقية

---

## النتيجة المتوقعة:
بعد تطبيق هذا الحل:
- ✅ البحث يعمل بشكل مثالي
- ✅ الفئات تُظهر منتجاتها عند النقر عليها
- ✅ يمكن البحث داخل فئة محددة
- ✅ واجهة سهلة ومفهومة

**آخر تحديث:** نوفمبر 2024  
**الحالة:** تم حل المشاكل وتحسين الأداء 