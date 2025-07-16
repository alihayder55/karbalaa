# إصلاح سريع لمشكلة قاعدة البيانات

## المشكلة
```
"column products_1.available_quantity does not exist"
```

## السبب
قاعدة البيانات لا تحتوي على عمود `available_quantity` ولكن الكود يحاول استخدامه.

## الحل

### الخطوة 1: تشغيل SQL في Supabase
افتح Supabase SQL Editor وانسخ هذا الكود:

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

-- تحديث المنتجات الموجودة
UPDATE products 
SET is_active = true 
WHERE is_active IS NULL;
```

### الخطوة 2: التحقق من النتائج
بعد تشغيل SQL، ستظهر رسائل تؤكد:
- إزالة عمود `available_quantity`
- إضافة عمود `is_active`
- تحديث البيانات الموجودة

### الخطوة 3: اختبار التطبيق
1. أعد تشغيل التطبيق
2. تحقق من عدم ظهور أخطاء قاعدة البيانات
3. تحقق من عرض حالة التوفر بشكل صحيح

## الملفات المحدثة

### 1. واجهات البيانات
- ✅ `walcard/types.ts` - تحديث واجهة Product
- ✅ `walcard/lib/favorites-manager.ts` - تحديث واجهة FavoriteProduct

### 2. الصفحات
- ✅ `walcard/app/store-owner/index.tsx` - إزالة مراجع available_quantity
- ✅ `walcard/app/store-owner/favorites.tsx` - تحديث استعلام المفضلة

### 3. مدير السلة
- ✅ `walcard/lib/cart-manager.ts` - تحديث واجهة CartItem

## النتائج المتوقعة

بعد الإصلاح:
- ✅ لن تظهر أخطاء قاعدة البيانات
- ✅ ستعمل جميع الصفحات بشكل طبيعي
- ✅ ستظهر حالة التوفر (متوفر/غير متوفر) بشكل صحيح
- ✅ ستعمل جميع الوظائف بدون مشاكل

## ملاحظات مهمة

- تم إزالة جميع مراجع `available_quantity` من الكود
- تم استخدام `is_active` لتحديد حالة التوفر
- المنتجات مع `is_active = true` تعتبر متوفرة
- المنتجات مع `is_active = false` تعتبر غير متوفرة 