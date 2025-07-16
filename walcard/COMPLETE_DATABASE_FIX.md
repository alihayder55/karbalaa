# إصلاح شامل لقاعدة البيانات

## المشاكل الحالية
1. `"column products_1.available_quantity does not exist"`
2. `"column products_1.name_ar does not exist"`

## الحل الشامل

### الخطوة 1: تشغيل SQL في Supabase
افتح **Supabase SQL Editor** وانسخ هذا الكود:

```sql
-- إزالة عمود available_quantity إذا كان موجوداً
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

-- التأكد من وجود عمود is_active
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

-- إضافة عمود name_ar إذا لم يكن موجوداً
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

-- إضافة عمود description_ar إذا لم يكن موجوداً
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

-- إضافة عمود unit إذا لم يكن موجوداً
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

-- تحديث المنتجات الموجودة
UPDATE products 
SET is_active = true 
WHERE is_active IS NULL;
```

### الخطوة 2: التحقق من النتائج
بعد تشغيل SQL، ستظهر رسائل تؤكد:
- إزالة عمود `available_quantity`
- إضافة عمود `is_active`
- إضافة عمود `name_ar`
- إضافة عمود `description_ar`
- إضافة عمود `unit`

### الخطوة 3: اختبار التطبيق
1. أعد تشغيل التطبيق
2. تحقق من عدم ظهور أخطاء قاعدة البيانات
3. تحقق من عمل جميع الصفحات

## الملفات المحدثة

### 1. واجهات البيانات
- ✅ `walcard/types.ts` - تحديث واجهة Product
- ✅ `walcard/lib/favorites-manager.ts` - تحديث واجهة FavoriteProduct

### 2. الصفحات
- ✅ `walcard/app/store-owner/index.tsx` - إزالة مراجع available_quantity
- ✅ `walcard/app/store-owner/favorites.tsx` - إصلاح استعلام المفضلة
- ✅ `walcard/app/store-owner/cart.tsx` - تحديث عرض التوفر
- ✅ `walcard/app/store-owner/(modals)/product-details.tsx` - تحديث تفاصيل المنتج
- ✅ `walcard/app/store-owner/search.tsx` - تحديث صفحة البحث

### 3. مدير السلة
- ✅ `walcard/lib/cart-manager.ts` - تحديث واجهة CartItem

## النتائج المتوقعة

بعد الإصلاح:
- ✅ لن تظهر أخطاء قاعدة البيانات
- ✅ ستعمل جميع الصفحات بشكل طبيعي
- ✅ ستظهر حالة التوفر (متوفر/غير متوفر) بشكل صحيح
- ✅ ستعمل صفحة المفضلة بدون أخطاء
- ✅ ستعمل جميع الوظائف بدون مشاكل

## ملاحظات مهمة

- تم إزالة جميع مراجع `available_quantity` من الكود
- تم استخدام `is_active` لتحديد حالة التوفر
- تم إضافة الأعمدة المفقودة (`name_ar`, `description_ar`, `unit`)
- المنتجات مع `is_active = true` تعتبر متوفرة
- المنتجات مع `is_active = false` تعتبر غير متوفرة 