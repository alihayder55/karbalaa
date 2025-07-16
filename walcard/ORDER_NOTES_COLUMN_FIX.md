# إصلاح عمود order_notes في جدول الطلبات

## المشكلة
كان التطبيق يعطي الخطأ التالي عند محاولة إنشاء طلب:
```
ERROR  ❌ Error creating order: {"code": "PGRST204", "details": null, "hint": null, "message": "Could not find the 'order_notes' column of 'orders' in the schema cache"}
```

## السبب
جدول `orders` في قاعدة البيانات لا يحتوي على العمود `order_notes` المطلوب لإنشاء الطلبات.

## الحل

### 1. تشغيل ملف SQL الإصلاحي
قم بتشغيل الملف `fix-order-notes-column.sql` في Supabase SQL Editor لإضافة العمود المفقود.

### 2. الأعمدة المضافة
```sql
-- إضافة الأعمدة المفقودة
ALTER TABLE orders ADD COLUMN order_notes TEXT;
ALTER TABLE orders ADD COLUMN delivery_address TEXT;
ALTER TABLE orders ADD COLUMN delivery_notes TEXT;
ALTER TABLE orders ADD COLUMN customer_name TEXT;
ALTER TABLE orders ADD COLUMN customer_phone TEXT;
```

### 3. الكود المتأثر
الملف `walcard/lib/cart-manager.ts` يحاول إدراج `order_notes` في جدول الطلبات:

```typescript
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    store_owner_id: currentUser.user_id,
    status: 'pending',
    total_price: totalPrice,
    order_notes: orderNotes, // هذا العمود كان مفقوداً
    created_at: new Date().toISOString()
  })
  .select()
  .single();
```

## خطوات التطبيق

### الخطوة 1: تشغيل SQL
1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ محتوى ملف `fix-order-notes-column.sql`
4. اضغط Run

### الخطوة 2: التحقق من النتائج
بعد تشغيل SQL، ستظهر رسائل تؤكد إضافة الأعمدة:
```
Added order_notes column to orders table
Added delivery_address column to orders table
Added delivery_notes column to orders table
Added customer_name column to orders table
Added customer_phone column to orders table
```

### الخطوة 3: اختبار التطبيق
1. أعد تشغيل التطبيق
2. اذهب إلى السلة
3. حاول إنشاء طلب جديد
4. تأكد من عدم ظهور أخطاء

## البيانات التجريبية
تم إضافة بيانات تجريبية للاختبار:
```sql
INSERT INTO orders (
    store_owner_id,
    status,
    total_price,
    order_notes,
    delivery_address,
    delivery_notes,
    customer_name,
    customer_phone
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'pending',
    150000,
    'طلب عادي',
    'شارع الرشيد، بغداد',
    'يرجى التوصيل في الصباح',
    'أحمد محمد',
    '+9647501234567'
);
```

## الملفات المتأثرة
- `walcard/lib/cart-manager.ts` - مدير السلة (لإنشاء الطلبات)
- `walcard/fix-order-notes-column.sql` - ملف إصلاح قاعدة البيانات

## النتائج المتوقعة
بعد تطبيق الإصلاح:
- ✅ لن تظهر أخطاء قاعدة البيانات عند إنشاء الطلبات
- ✅ ستعمل وظيفة إنشاء الطلب من السلة
- ✅ ستظهر ملاحظات الطلب في تفاصيل الطلب
- ✅ ستعمل جميع وظائف إدارة الطلبات

## ملاحظات مهمة
1. تأكد من تشغيل ملف SQL قبل اختبار التطبيق
2. إذا كانت هناك بيانات موجودة، لن تتأثر
3. العمود `order_notes` اختياري ويمكن أن يكون فارغاً
4. جميع الأعمدة الجديدة من نوع TEXT ويمكن أن تكون فارغة

## اختبار إضافي
بعد الإصلاح، يمكنك اختبار:
1. إضافة منتجات إلى السلة
2. إنشاء طلب جديد
3. إضافة ملاحظات للطلب
4. التحقق من حفظ الملاحظات في قاعدة البيانات 