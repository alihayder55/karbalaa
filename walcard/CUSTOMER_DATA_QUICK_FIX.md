# إصلاح سريع - معلومات العميل من قاعدة البيانات

## المشكلة
معلومات العميل لا تظهر من قاعدة البيانات في صفحة تفاصيل الطلب.

## الحل السريع

### الخطوة 1: تشغيل سكريبت إضافة الأعمدة
1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ محتوى ملف `fix-orders-table.sql`
4. اضغط Run

### الخطوة 2: إضافة بيانات تجريبية
1. في SQL Editor
2. انسخ محتوى ملف `add-sample-orders.sql`
3. اضغط Run

### الخطوة 3: اختبار التطبيق
1. افتح التطبيق
2. اذهب إلى صفحة الطلبات
3. اضغط على أي طلب
4. تحقق من ظهور معلومات العميل

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

## التحقق من العمل:

### في Console ستظهر:
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

### في التطبيق ستظهر:
- ✅ اسم العميل من قاعدة البيانات
- ✅ رقم الهاتف من قاعدة البيانات
- ✅ العنوان من قاعدة البيانات
- ✅ ملاحظات التوصيل من قاعدة البيانات
- ✅ ملاحظات الطلب من قاعدة البيانات

## النتيجة:
✅ **معلومات العميل من قاعدة البيانات**  
✅ **بيانات تجريبية للاختبار**  
✅ **عرض ديناميكي للبيانات**  
✅ **معالجة البيانات الفارغة**

## ملاحظات:
- تأكد من تشغيل سكريبت إضافة الأعمدة أولاً
- ثم أضف البيانات التجريبية
- اختبر التطبيق بعد كل خطوة 