# إصلاح هيكل جدول الطلبات

## المشكلة
جدول `orders` الحالي لا يحتوي على الأعمدة المطلوبة لمعلومات العميل:
- ❌ `customer_name` - اسم العميل
- ❌ `customer_phone` - رقم هاتف العميل
- ❌ `delivery_address` - عنوان التوصيل
- ❌ `delivery_notes` - ملاحظات التوصيل
- ❌ `order_notes` - ملاحظات الطلب

## الهيكل الحالي:
```sql
CREATE TABLE orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  store_owner_id uuid NULL,
  status text NULL DEFAULT 'pending',
  total_price numeric(12, 2) NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now()
);
```

## الحل:

### الخطوة 1: تشغيل سكريبت إضافة الأعمدة
1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ محتوى ملف `add-customer-columns-to-orders.sql`
4. اضغط Run

### الخطوة 2: التحقق من النتيجة
بعد تشغيل السكريبت، ستظهر رسالة نجاح:
```
Customer columns added to orders table successfully!
```

### الخطوة 3: الهيكل الجديد
```sql
CREATE TABLE orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  store_owner_id uuid NULL,
  status text NULL DEFAULT 'pending',
  total_price numeric(12, 2) NOT NULL,
  customer_name TEXT,           -- ✅ جديد
  customer_phone TEXT,          -- ✅ جديد
  delivery_address TEXT,        -- ✅ جديد
  delivery_notes TEXT,          -- ✅ جديد
  order_notes TEXT,             -- ✅ جديد
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now()
);
```

## البيانات التجريبية المضافة:

### طلب 1:
- **الاسم**: أحمد محمد علي
- **الهاتف**: +9647501234567
- **العنوان**: شارع الرشيد، بغداد، العراق
- **ملاحظات التوصيل**: يرجى التوصيل في الصباح قبل الساعة 10
- **ملاحظات الطلب**: طلب عاجل - يرجى التحضير بسرعة

### طلب 2:
- **الاسم**: فاطمة حسن
- **الهاتف**: +9647509876543
- **العنوان**: شارع فلسطين، بغداد، العراق
- **ملاحظات التوصيل**: التوصيل في المساء بعد الساعة 6
- **ملاحظات الطلب**: يرجى التأكد من جودة المنتجات

### طلب 3:
- **الاسم**: محمد عبدالله
- **الهاتف**: +9647505551234
- **العنوان**: شارع الكفاح، بغداد، العراق
- **ملاحظات التوصيل**: التوصيل في أي وقت مناسب
- **ملاحظات الطلب**: منتجات طازجة مطلوبة

## كيفية الاختبار:

### الخطوة 1: تشغيل السكريبت
1. انسخ محتوى `add-customer-columns-to-orders.sql`
2. الصق في Supabase SQL Editor
3. اضغط Run

### الخطوة 2: اختبار التطبيق
1. افتح التطبيق
2. اذهب إلى صفحة الطلبات
3. اضغط على أي طلب
4. تحقق من ظهور معلومات العميل

### الخطوة 3: التحقق من Console
ستظهر في console:
```
📊 Order data loaded: {
  id: "...",
  customer_name: "أحمد محمد علي",
  customer_phone: "+9647501234567",
  delivery_address: "شارع الرشيد، بغداد، العراق",
  delivery_notes: "يرجى التوصيل في الصباح قبل الساعة 10",
  order_notes: "طلب عاجل - يرجى التحضير بسرعة"
}
```

## النتيجة:
✅ **إضافة الأعمدة المفقودة**  
✅ **بيانات تجريبية للاختبار**  
✅ **صفحة تفاصيل الطلب تعمل**  
✅ **معلومات العميل من قاعدة البيانات**

## ملاحظات مهمة:
- السكريبت آمن ولا يؤثر على البيانات الموجودة
- يضيف الأعمدة فقط إذا لم تكن موجودة
- يضيف بيانات تجريبية للاختبار
- يحافظ على الهيكل الحالي للجدول 