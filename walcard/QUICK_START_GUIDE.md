# دليل البدء السريع - تحديث قاعدة البيانات

## نظرة سريعة

تم تحديث الكود ليتوافق مع قاعدة البيانات الجديدة. هذا الدليل يوضح كيفية تطبيق التحديثات بسرعة.

## التحديثات المكتملة ✅

### 1. الملفات المحدثة:
- ✅ `lib/supabase.ts` - تحديث كامل مع دوال جديدة
- ✅ `lib/test-connection.ts` - تحديث لاستخدام جدول `users`
- ✅ `app/auth/unified-auth.tsx` - تحديث الاستيرادات والدوال
- ✅ `app/auth/merchant-registration.tsx` - تحديث الاستيرادات والدوال
- ✅ `app/auth/store-owner-registration.tsx` - تحديث الاستيرادات والدوال
- ✅ `types.ts` - تعريفات TypeScript محدثة

### 2. الملفات الجديدة:
- ✅ `default-data.sql` - بيانات افتراضية مطلوبة
- ✅ `test-connection-quick.sql` - سكريبت اختبار سريع
- ✅ `DATABASE_INTEGRATION_GUIDE.md` - دليل شامل

## خطوات التطبيق السريعة

### الخطوة 1: تطبيق قاعدة البيانات الجديدة

1. **اذهب إلى Supabase Dashboard**
2. **افتح SQL Editor**
3. **انسخ والصق قاعدة البيانات الجديدة** (التي قدمتها لك)
4. **اضغط Run**

### الخطوة 2: إضافة البيانات الافتراضية

1. **في نفس SQL Editor**
2. **انسخ محتوى `default-data.sql`**
3. **اضغط Run**

### الخطوة 3: اختبار التطبيق

1. **انسخ محتوى `test-connection-quick.sql`**
2. **اضغط Run في SQL Editor**
3. **تحقق من النتائج**

## اختبار سريع للتطبيق

### 1. اختبار الاتصال:
```typescript
// في أي ملف React Native
import { supabase } from '../../lib/supabase';

const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error);
    } else {
      console.log('✅ Connection successful');
    }
  } catch (error) {
    console.error('❌ Connection error:', error);
  }
};
```

### 2. اختبار إنشاء مستخدم:
```typescript
import { createUser } from '../../lib/supabase';

const testUserCreation = async () => {
  const userData = {
    full_name: 'Test User',
    phone_number: '+964123456789',
    user_type: 'merchant' as const
  };
  
  const result = await createUser(userData);
  
  if (result.success) {
    console.log('✅ User created:', result.data);
  } else {
    console.error('❌ User creation failed:', result.error);
  }
};
```

### 3. اختبار التحقق من المستخدم:
```typescript
import { getUserAccountInfo } from '../../lib/supabase';

const testUserCheck = async () => {
  const userInfo = await getUserAccountInfo('+964123456789');
  console.log('User info:', userInfo);
};
```

## التحقق من النتائج

### في SQL Editor، افحص:

1. **هل الجداول موجودة؟**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'merchants', 'store_owners');
```

2. **هل البيانات الافتراضية موجودة؟**
```sql
SELECT COUNT(*) FROM product_categories;
SELECT COUNT(*) FROM unit;
SELECT COUNT(*) FROM news;
```

3. **هل الفهارس موجودة؟**
```sql
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'users';
```

## استكشاف الأخطاء الشائعة

### مشكلة: "relation 'profiles' does not exist"
**الحل:** تأكد من تطبيق قاعدة البيانات الجديدة بالكامل

### مشكلة: "column 'business_type' does not exist"
**الحل:** تأكد من أن جدول `store_owners` يحتوي على العمود `business_type`

### مشكلة: "function get_user_account_info does not exist"
**الحل:** استخدم الدوال الجديدة في `supabase.ts` بدلاً من RPC

### مشكلة: "RLS policy violation"
**الحل:** تأكد من تطبيق سياسات RLS من ملف `default-data.sql`

## نصائح سريعة

### 1. اختبار في بيئة التطوير أولاً
```bash
# تأكد من أن التطبيق يعمل
npx expo start
```

### 2. تحقق من السجلات
```typescript
// أضف سجلات مفصلة
console.log('User data:', userData);
console.log('API response:', result);
```

### 3. استخدم TypeScript للتحقق من الأخطاء
```typescript
// استخدم الأنواع المحددة
import { User, Merchant, StoreOwner } from '../../types';
```

## التحقق النهائي

### ✅ قائمة التحقق:

- [ ] قاعدة البيانات الجديدة مطبقة
- [ ] البيانات الافتراضية مضافة
- [ ] التطبيق يتصل بقاعدة البيانات
- [ ] إنشاء المستخدمين يعمل
- [ ] تسجيل التجار يعمل
- [ ] تسجيل أصحاب المحلات يعمل
- [ ] التحقق من المستخدمين يعمل
- [ ] لا توجد أخطاء في Console

### 🎯 النتيجة المتوقعة:

بعد تطبيق جميع التحديثات، يجب أن يعمل التطبيق بدون أخطاء ويتمكن من:
- ✅ الاتصال بقاعدة البيانات الجديدة
- ✅ إنشاء المستخدمين الجدد
- ✅ تسجيل التجار وأصحاب المحلات
- ✅ التحقق من وجود المستخدمين
- ✅ عرض البيانات الثابتة (المدن، أنواع الأعمال، إلخ)

## الدعم

إذا واجهت أي مشاكل:

1. **تحقق من سجلات Supabase** في Dashboard
2. **اختبر الاتصال** باستخدام `test-connection-quick.sql`
3. **تحقق من سياسات RLS** في Authentication > Policies
4. **راجع السجلات** في Console للتطبيق

التحديث جاهز للاستخدام! 🚀 