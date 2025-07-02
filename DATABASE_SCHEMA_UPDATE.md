# تحديث تصميم قاعدة البيانات - ولكارد

## المشكلة الأصلية

كان هناك خطأ في قاعدة البيانات الحالية:
```ERROR: Could not find the 'business_type' column of 'store_owners' in the schema cache
```

## الحلول المقدمة

### 1. ملف قاعدة البيانات المحسن (`database-schema-enhanced.sql`)

هذا الملف يحتوي على تصميم قاعدة بيانات كامل ومحسن يتضمن:

#### الجداول الأساسية المحسنة:

**جدول `users` (بدلاً من `profiles`):**
```sql
- id: UUID (مرتبط بـ auth.users)
- full_name: النام الكامل
- phone_number: رقم الهاتف (فريد)
- user_type: نوع المستخدم ('merchant', 'store_owner', 'admin')
- avatar_url: رابط الصورة الشخصية
- is_approved: حالة الموافقة
- created_at, updated_at: تواريخ الإنشاء والتحديث
```

**جدول `merchants` المحسن:**
```sql
- user_id: UUID (مرتبط بـ users.id)
- business_name: اسم النشاط التجاري
- company_name: اسم الشركة
- store_name: اسم المحل
- phone_number: رقم الهاتف
- whatsapp_number: رقم الواتساب
- business_type: نوع النشاط التجاري
- address: العنوان
- city: المدينة
- district: المنطقة
- nearest_landmark: أقرب معلم
- latitude, longitude: إحداثيات GPS
- working_days: أيام العمل
- opening_time, closing_time: أوقات العمل
- identity_image: صورة الهوية
- store_image: صورة المحل
- chamber_of_commerce_id: رقم غرفة التجارة
- wants_ads: يريد إعلانات
- offers_daily_deals: يعرض عروض يومية
- is_approved: حالة الموافقة
```

**جدول `store_owners` المحسن:**
```sql
- user_id: UUID (مرتبط بـ users.id)
- full_name: النام الكامل
- company_name: اسم الشركة
- store_name: اسم المحل
- phone_number: رقم الهاتف
- whatsapp_number: رقم الواتساب
- store_type: نوع المحل
- business_type: نوع النشاط التجاري
- address: العنوان
- city: المدينة
- district: المنطقة
- nearest_landmark: أقرب معلم
- latitude, longitude: إحداثيات GPS
- working_days: أيام العمل
- opening_time, closing_time: أوقات العمل
- storefront_image: صورة واجهة المحل
- wants_ads: يريد إعلانات
- offers_daily_deals: يعرض عروض يومية
- is_approved: حالة الموافقة
```

#### الجداول الإضافية:

**إدارة المنتجات:**
- `product_categories`: فئات المنتجات
- `subcategories`: الفئات الفرعية
- `products`: المنتجات

**إدارة الطلبات:**
- `orders`: الطلبات
- `order_items`: عناصر الطلبات
- `order_status_logs`: سجل حالة الطلبات

**النظام الإداري:**
- `admins`: المشرفين
- `reports`: البلاغات
- `notifications`: الإشعارات
- `user_auth_logs`: سجل المصادقة
- `news`: الأخبار

### 2. ملف الترحيل (`database-migration.sql`)

هذا الملف يحدث قاعدة البيانات الحالية دون فقدان البيانات:

#### خطوات الترحيل:
1. **إضافة الأعمدة المفقودة** لجدولي `merchants` و `store_owners`
2. **تحديث جدول `profiles`** إلى `users` مع الحفاظ على البيانات
3. **تحديث العلاقات** بين الجداول
4. **إضافة القيود والفهارس** للأداء
5. **تحديث الدوال والـ Triggers**
6. **تحديث سياسات الأمان (RLS)**

## التحسينات الرئيسية

### 1. التوافق مع التطبيق
- ✅ إضافة جميع الأعمدة المطلوبة في التطبيق
- ✅ دعم `business_type` في جدول `store_owners`
- ✅ دعم `store_type` في جدول `store_owners`
- ✅ دعم `nearest_landmark` في كلا الجدولين

### 2. تحسين الأداء
- ✅ إضافة فهارس للأعمدة المستخدمة بكثرة
- ✅ تحسين استعلامات البحث
- ✅ تحسين أداء العلاقات بين الجداول

### 3. تحسين الأمان
- ✅ تفعيل Row Level Security (RLS)
- ✅ سياسات أمان محددة لكل جدول
- ✅ صلاحيات دقيقة للمستخدمين

### 4. دعم متعدد اللغات
- ✅ أعمدة منفصلة للعربية والإنجليزية
- ✅ دعم RTL في التطبيق
- ✅ أسماء المدن والأنواع بالعربية

## كيفية التطبيق

### الخيار الأول: إنشاء قاعدة بيانات جديدة
```bash
# تنفيذ الملف الكامل
psql -h your-host -U your-user -d your-database -f database-schema-enhanced.sql
```

### الخيار الثاني: تحديث قاعدة البيانات الحالية
```bash
# تنفيذ ملف الترحيل
psql -h your-host -U your-user -d your-database -f database-migration.sql
```

## التحقق من التطبيق

### 1. التحقق من الأعمدة المطلوبة
```sql
-- التحقق من جدول merchants
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'merchants' AND column_name IN ('business_name', 'store_type', 'nearest_landmark');

-- التحقق من جدول store_owners
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'store_owners' AND column_name IN ('business_type', 'store_type', 'nearest_landmark');
```

### 2. التحقق من الدوال
```sql
-- اختبار دالة get_user_account_info
SELECT * FROM get_user_account_info('+964123456789');
```

### 3. التحقق من البيانات الافتراضية
```sql
-- التحقق من أنواع الأعمال
SELECT * FROM business_types;

-- التحقق من المدن
SELECT * FROM cities;

-- التحقق من أيام العمل
SELECT * FROM working_days;
```

## المميزات الجديدة

### 1. دعم كامل للمنتجات
- تصنيفات وفئات فرعية
- صور وأسعار
- إدارة المخزون
- عروض وتخفيضات

### 2. نظام طلبات متكامل
- تتبع حالة الطلبات
- سجل التغييرات
- إدارة التوصيل

### 3. نظام إشعارات
- إشعارات فورية
- دعم متعدد اللغات
- أنواع مختلفة من الإشعارات

### 4. نظام إداري
- مستويات إدارية مختلفة
- صلاحيات محددة
- تقارير وبلاغات

## نصائح للاستخدام

### 1. النسخ الاحتياطية
```bash
# عمل نسخة احتياطية قبل التحديث
pg_dump -h your-host -U your-user your-database > backup_before_migration.sql
```

### 2. الاختبار
```bash
# اختبار في بيئة التطوير أولاً
# تأكد من عمل جميع الوظائف قبل التطبيق في الإنتاج
```

### 3. المراقبة
```sql
-- مراقبة أداء قاعدة البيانات
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE schemaname = 'public';
```

## الدعم والمساعدة

إذا واجهت أي مشاكل أثناء التطبيق:

1. **تحقق من السجلات** في Supabase Dashboard
2. **اختبر الدوال** بشكل منفصل
3. **تحقق من الصلاحيات** للمستخدمين
4. **راجع سياسات RLS** إذا كانت هناك مشاكل في الوصول

## الخلاصة

التحديث الجديد يحل مشكلة التوافق مع التطبيق ويضيف مميزات متقدمة لـ:
- ✅ إدارة المنتجات والطلبات
- ✅ نظام إشعارات متكامل
- ✅ إدارة إدارية متقدمة
- ✅ أداء محسن وأمان أفضل
- ✅ دعم كامل للغة العربية 