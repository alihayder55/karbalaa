# إصلاح قاعدة البيانات - جدول الطلبات

## المشكلة
كان هناك خطأ في صفحة تفاصيل الطلب:
```
ERROR  Error loading order: {"code": "42703", "details": null, "hint": null, "message": "column orders.delivery_address does not exist"}
```

## السبب
جدول `orders` في قاعدة البيانات لا يحتوي على الأعمدة التالية:
- `delivery_address` - عنوان التوصيل
- `delivery_notes` - ملاحظات التوصيل
- `customer_name` - اسم العميل
- `customer_phone` - هاتف العميل

## الحل

### 1. تشغيل ملف SQL الإصلاحي
قم بتشغيل الملف `fix-orders-table.sql` في Supabase SQL Editor لإضافة الأعمدة المفقودة.

### 2. الأعمدة المضافة
```sql
-- إضافة الأعمدة المفقودة
ALTER TABLE orders ADD COLUMN delivery_address TEXT;
ALTER TABLE orders ADD COLUMN delivery_notes TEXT;
ALTER TABLE orders ADD COLUMN customer_name TEXT;
ALTER TABLE orders ADD COLUMN customer_phone TEXT;
```

### 3. تحديث الكود
تم تحديث صفحة تفاصيل الطلب لتعمل مع قاعدة البيانات الحالية:

#### قبل الإصلاح:
```typescript
interface Order {
  delivery_address?: string;
  delivery_notes?: string;
  customer_name?: string;
  customer_phone?: string;
}
```

#### بعد الإصلاح:
```typescript
interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}
```

### 4. عرض البيانات
تم تحديث الواجهة لعرض قيم افتراضية:
- اسم العميل: "غير محدد"
- هاتف العميل: "غير محدد"
- عنوان التوصيل: "غير محدد"
- ملاحظات التوصيل: "لا توجد ملاحظات"

## خطوات التطبيق

### الخطوة 1: تشغيل SQL
1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ محتوى ملف `fix-orders-table.sql`
4. اضغط Run

### الخطوة 2: التحقق من النتائج
بعد تشغيل SQL، ستظهر رسائل تؤكد إضافة الأعمدة:
```
Added delivery_address column to orders table
Added delivery_notes column to orders table
Added customer_name column to orders table
Added customer_phone column to orders table
```

### الخطوة 3: اختبار التطبيق
1. أعد تشغيل التطبيق
2. اذهب إلى صفحة الطلبات
3. اضغط على أي طلب لفتح تفاصيله
4. تأكد من عدم ظهور أخطاء

## البيانات التجريبية
تم إضافة بيانات تجريبية للاختبار:
```sql
INSERT INTO orders (
    store_owner_id,
    status,
    total_price,
    delivery_address,
    delivery_notes,
    customer_name,
    customer_phone
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'pending',
    150000,
    'شارع الرشيد، بغداد',
    'يرجى التوصيل في الصباح',
    'أحمد محمد',
    '+9647501234567'
);
```

## الملفات المتأثرة
- `walcard/app/store-owner/(modals)/order-details.tsx` - صفحة تفاصيل الطلب
- `walcard/fix-orders-table.sql` - ملف إصلاح قاعدة البيانات

## النتائج المتوقعة
بعد تطبيق الإصلاح:
- ✅ لن تظهر أخطاء قاعدة البيانات
- ✅ ستظهر صفحة تفاصيل الطلب بشكل صحيح
- ✅ ستظهر البيانات التجريبية في الطلبات
- ✅ ستعمل أزرار تحديث الحالة

## ملاحظات مهمة
1. تأكد من تشغيل ملف SQL قبل اختبار التطبيق
2. إذا كانت هناك بيانات موجودة، لن تتأثر
3. الأعمدة الجديدة ستكون فارغة للبيانات القديمة
4. يمكن إضافة البيانات يدوياً أو من خلال التطبيق

## التحسينات المستقبلية
بعد إصلاح قاعدة البيانات، يمكن:
- إضافة واجهة لإدخال بيانات العميل
- إضافة خريطة لاختيار عنوان التوصيل
- إضافة نظام إشعارات للعملاء
- إضافة تتبع حالة الطلب 