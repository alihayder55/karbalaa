# واجهة صاحب المحل - Store Owner Interface

## نظرة عامة

تم إنشاء واجهة خاصة بصاحب المحل تختلف عن واجهة التاجر العادي. هذه الواجهة تتيح لصاحب المحل الوصول إلى جميع الميزات المطلوبة لإدارة متجره وعرض المنتجات للعملاء.

## الميزات الرئيسية

### 1. الصفحة الرئيسية (`/store-owner/index.tsx`)
- **شريط البحث**: للبحث عن المنتجات
- **الأخبار والعروض**: عرض أحدث الأخبار والعروض الخاصة
- **المنتجات المتوفرة**: عرض جميع المنتجات مع إمكانية إضافتها للسلة
- **أيقونة السلة**: في أعلى الصفحة مع عداد المنتجات

### 2. صفحة الطلبات (`/store-owner/orders.tsx`)
- **عرض جميع الطلبات**: مع تصفية حسب الحالة
- **حالات الطلبات**: في الانتظار، مؤكد، تم الشحن، تم التوصيل، ملغي
- **تفاصيل كل طلب**: رقم الطلب، التاريخ، المبلغ، عدد المنتجات
- **إمكانية تحديث حالة الطلب**

### 3. صفحة السلة (`/store-owner/cart.tsx`)
- **عرض المنتجات المضافة**: مع إمكانية تعديل الكمية
- **حذف المنتجات**: من السلة
- **ملخص الطلب**: المجموع الفرعي، الخصم، المجموع الكلي
- **إتمام الطلب**: الانتقال لصفحة إتمام الطلب

### 4. صفحة البحث (`/store-owner/search.tsx`)
- **بحث متقدم**: في اسم المنتج والوصف
- **تصفية حسب الفئة**: مواد غذائية، منظفات، مشروبات
- **نتائج البحث**: عرض المنتجات المطابقة
- **إضافة للسلة**: مباشرة من نتائج البحث

### 5. صفحة تفاصيل المنتج (`/store-owner/product-details.tsx`)
- **معلومات شاملة**: اسم، وصف، سعر، صورة
- **المواصفات**: تفاصيل المنتج والمواصفات
- **إدارة الكمية**: زيادة أو تقليل الكمية
- **إضافة للسلة**: أو شراء مباشر

### 6. صفحة تفاصيل الأخبار (`/store-owner/news-details.tsx`)
- **محتوى كامل**: العنوان، المحتوى، التاريخ
- **أخبار ذات صلة**: عرض أخبار مشابهة
- **مشاركة الخبر**: مع العملاء

### 7. صفحة تفاصيل العروض (`/store-owner/offer-details.tsx`)
- **تفاصيل العرض**: الخصم، الشروط، المنتجات المشمولة
- **حساب التوفير**: السعر الأصلي والسعر بعد الخصم
- **عروض أخرى**: عرض عروض مشابهة

### 8. صفحة تفاصيل الطلب (`/store-owner/order-details.tsx`)
- **معلومات العميل**: الاسم، الهاتف، العنوان
- **تفاصيل الطلب**: المنتجات، الكميات، الأسعار
- **تحديث الحالة**: تأكيد، شحن، توصيل
- **اتصال بالعميل**: مباشرة من الصفحة

### 9. صفحة إتمام الطلب (`/store-owner/checkout.tsx`)
- **معلومات العميل**: الاسم، الهاتف، العنوان
- **طريقة الدفع**: نقداً أو بطاقة ائتمان
- **ملخص الفاتورة**: المجموع، رسوم التوصيل
- **إرسال الطلب**: تأكيد الطلب

### 10. صفحة الملف الشخصي (`/store-owner/profile.tsx`)
- **معلومات المتجر**: الاسم، النوع، العنوان
- **ساعات العمل**: أيام العمل، أوقات الفتح والإغلاق
- **معلومات الاتصال**: الهاتف، البريد الإلكتروني
- **الإعدادات**: تغيير كلمة المرور، الإشعارات، المساعدة

## التنقل بين الصفحات

### التبويبات الرئيسية
- **الرئيسية**: الصفحة الرئيسية مع البحث والأخبار والمنتجات
- **الطلبات**: عرض وإدارة جميع الطلبات
- **الملف الشخصي**: إعدادات الحساب والمتجر

### الصفحات الإضافية
- **السلة**: إدارة المنتجات المضافة للسلة
- **البحث**: البحث المتقدم في المنتجات
- **تفاصيل المنتج**: عرض معلومات المنتج الكاملة
- **تفاصيل الأخبار**: قراءة الأخبار الكاملة
- **تفاصيل العروض**: عرض العروض والخصومات
- **تفاصيل الطلب**: إدارة الطلبات الفردية
- **إتمام الطلب**: عملية الشراء النهائية

## الميزات التقنية

### التصميم
- **واجهة عربية**: تصميم مخصص للغة العربية
- **ألوان متناسقة**: استخدام اللون البرتقالي (#FF6B35) كلون رئيسي
- **تصميم متجاوب**: يعمل على جميع أحجام الشاشات

### الأداء
- **تحميل سريع**: استخدام بيانات وهمية للعرض
- **تحديث فوري**: تحديث البيانات عند الحاجة
- **تجربة سلسة**: انتقالات سلسة بين الصفحات

### الأمان
- **تحقق من المدخلات**: التحقق من صحة البيانات المدخلة
- **حماية من الأخطاء**: معالجة الأخطاء بشكل آمن
- **جلسات آمنة**: إدارة الجلسات بشكل آمن

## كيفية الاستخدام

### للمطورين
1. **إضافة بيانات حقيقية**: استبدال البيانات الوهمية ببيانات حقيقية من قاعدة البيانات
2. **ربط API**: ربط الصفحات بـ API حقيقي
3. **إضافة ميزات**: إضافة ميزات إضافية حسب الحاجة

### للمستخدمين
1. **التسجيل**: تسجيل حساب جديد كصاحب محل
2. **إعداد المتجر**: إدخال معلومات المتجر
3. **إضافة المنتجات**: إضافة المنتجات المتوفرة
4. **إدارة الطلبات**: متابعة وإدارة الطلبات الواردة

## الملفات المضافة

```
walcard/app/store-owner/
├── _layout.tsx              # تخطيط التبويبات
├── index.tsx                # الصفحة الرئيسية
├── orders.tsx               # صفحة الطلبات
├── profile.tsx              # صفحة الملف الشخصي
├── cart.tsx                 # صفحة السلة
├── search.tsx               # صفحة البحث
├── product-details.tsx      # تفاصيل المنتج
├── news-details.tsx         # تفاصيل الأخبار
├── offer-details.tsx        # تفاصيل العروض
├── order-details.tsx        # تفاصيل الطلب
└── checkout.tsx             # إتمام الطلب
```

## التحديثات المستقبلية

- [ ] إضافة نظام إشعارات
- [ ] إضافة تقارير المبيعات
- [ ] إضافة إدارة المخزون
- [ ] إضافة نظام التقييمات
- [ ] إضافة نظام الولاء
- [ ] إضافة دفع إلكتروني
- [ ] إضافة تتبع الشحنات
- [ ] إضافة نظام الخصومات

## الدعم

لأي استفسارات أو مشاكل تقنية، يرجى التواصل مع فريق التطوير. 