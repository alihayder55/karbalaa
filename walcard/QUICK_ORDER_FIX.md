# إصلاح سريع لمشكلة إنشاء الطلبات

## المشكلة
```
ERROR  ❌ Error creating order: {"code": "PGRST204", "details": null, "hint": null, "message": "Could not find the 'order_notes' column of 'orders' in the schema cache"}
```

## الحل السريع

### الخطوة 1: تشغيل SQL في Supabase
افتح Supabase SQL Editor وانسخ هذا الكود:

```sql
-- إضافة عمود order_notes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_notes'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_notes TEXT;
        RAISE NOTICE 'Added order_notes column';
    END IF;
END $$;

-- التأكد من وجود الجدول
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_owner_id UUID,
    status TEXT DEFAULT 'pending',
    total_price NUMERIC(12, 2) NOT NULL,
    order_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- اختبار الإدراج
INSERT INTO orders (
    store_owner_id,
    status,
    total_price,
    order_notes
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'pending',
    100000,
    'طلب اختبار'
) ON CONFLICT DO NOTHING;
```

### الخطوة 2: تحديث الكود
تم تحديث `cart-manager.ts` لإزالة `created_at` وجعل `order_notes` اختياري.

### الخطوة 3: اختبار التطبيق
1. أعد تشغيل التطبيق
2. جرب إنشاء طلب من السلة
3. تأكد من عدم ظهور أخطاء

## إذا استمرت المشكلة

### تحقق من هيكل الجدول:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
```

### تحقق من وجود الجدول:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'orders';
```

## الملفات المحدثة
- `walcard/lib/cart-manager.ts` - إصلاح إنشاء الطلب
- `walcard/simple-order-fix.sql` - إصلاح قاعدة البيانات
- `walcard/test-order-creation.js` - اختبار إنشاء الطلب

## النتائج المتوقعة
- ✅ إنشاء الطلبات بدون أخطاء
- ✅ حفظ ملاحظات الطلب (اختياري)
- ✅ عمل جميع وظائف السلة 