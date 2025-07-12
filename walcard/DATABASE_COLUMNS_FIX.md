# إصلاح أخطاء أعمدة قاعدة البيانات

## المشكلة
كان التطبيق يعطي الأخطاء التالية:
```
ERROR  Error loading categories: {"code": "42703", "details": null, "hint": "Perhaps you meant to reference the column \"product_categories.name\".", "message": "column product_categories.name_ar does not exist"}
ERROR  Error loading orders: {"code": "42703", "details": null, "hint": null, "message": "column orders.delivery_address does not exist"}
```

## السبب
كانت قاعدة البيانات المستخدمة لا تحتوي على بعض الأعمدة المطلوبة:
- `product_categories.name_ar`
- `orders.delivery_address`
- `products.name_ar`
- `products.unit`

## الحل
### 1. تم إنشاء ملف `fix-database-columns.sql`
هذا الملف يحتوي على:
- إضافة الأعمدة المفقودة
- إنشاء الجداول المفقودة
- إضافة فهارس للأداء
- إعداد سياسات RLS
- إدراج بيانات تجريبية

### 2. تم تحديث الكود
- إعادة تفعيل استخدام `name_ar` في التصنيفات
- إعادة تفعيل استخدام `delivery_address` في الطلبات
- إصلاح واجهات البيانات (interfaces)

## كيفية تطبيق الإصلاح
1. قم بتشغيل الملف `fix-database-columns.sql` في قاعدة البيانات:
   ```sql
   -- في Supabase SQL Editor، انسخ والصق محتويات الملف
   ```

2. أعد تشغيل التطبيق

## الميزات المضافة
- دعم كامل للأسماء العربية في التصنيفات
- إمكانية حفظ عناوين التوصيل مع الطلبات
- دعم وحدات القياس للمنتجات
- ربط الطلبات بأصحاب المتاجر والتجار

## الملفات المُحدّثة
- `app/store-owner/search.tsx` - إصلاح البحث والتصنيفات
- `app/store-owner/orders.tsx` - إصلاح عرض الطلبات
- `fix-database-columns.sql` - سكريبت إصلاح قاعدة البيانات

## ملاحظات
- جميع التغييرات متوافقة مع البيانات الموجودة
- الأعمدة الجديدة اختيارية ولن تؤثر على البيانات الحالية
- تم إضافة قيم افتراضية حيث أمكن 