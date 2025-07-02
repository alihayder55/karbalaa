# دليل ربط التطبيق مع قاعدة البيانات الجديدة - ولكارد

## نظرة عامة

تم تحديث قاعدة البيانات لتكون أكثر بساطة وفعالية. هذا الدليل يوضح كيفية ربط التطبيق مع التصميم الجديد.

## التغييرات الرئيسية في قاعدة البيانات

### 1. جدول `users` الجديد
```sql
- id: UUID (primary key)
- full_name: TEXT (required)
- phone_number: TEXT (unique, required)
- phone_number_1: TEXT (optional)
- phone_number_2: TEXT (optional)
- whatsapp_number: TEXT (optional)
- user_type: TEXT (merchant, store_owner, admin)
- avatar_url: TEXT (optional)
- is_approved: BOOLEAN (default: false)
```

### 2. جدول `merchants` المحدث
```sql
- user_id: UUID (primary key, references users.id)
- business_name: TEXT (required)
- business_type: TEXT (required)
- nearest_landmark: TEXT (required)
- city: TEXT (required)
- region: TEXT (required)
- work_days: TEXT (required)
- open_time: TIME (required)
- close_time: TIME (required)
- identity_image: TEXT (optional)
- store_image: TEXT (optional)
- latitude: NUMERIC(9,6) (optional)
- longitude: NUMERIC(9,6) (optional)
- abs: BOOLEAN (required)
```

### 3. جدول `store_owners` المحدث
```sql
- user_id: UUID (primary key, references users.id)
- store_name: TEXT (required)
- store_type: TEXT (required)
- address: TEXT (required)
- nearest_landmark: TEXT (required)
- work_days: TEXT (required)
- open_time: TIME (required)
- close_time: TIME (required)
- storefront_image: TEXT (optional)
- latitude: NUMERIC(9,6) (optional)
- longitude: NUMERIC(9,6) (optional)
```

## الملفات المحدثة

### 1. `lib/supabase-updated.ts`
هذا الملف يحتوي على:
- تكوين Supabase المحدث
- دوال جديدة للتعامل مع قاعدة البيانات الجديدة
- دوال مساعدة للبيانات الثابتة

#### الدوال الرئيسية:
```typescript
// التحقق من وجود المستخدم
getUserAccountInfo(phoneNumber: string)

// إنشاء مستخدم جديد
createUser(userData: UserRegistrationData)

// إنشاء حساب تاجر
createMerchant(merchantData: MerchantRegistrationData)

// إنشاء حساب صاحب محل
createStoreOwner(storeOwnerData: StoreOwnerRegistrationData)

// الحصول على أنواع الأعمال
getBusinessTypes()

// الحصول على المدن
getCities()

// الحصول على أيام العمل
getWorkingDays()
```

### 2. `types.ts`
يحتوي على تعريفات TypeScript لجميع الجداول والبيانات:

```typescript
// أنواع الجداول
interface User { ... }
interface Merchant { ... }
interface StoreOwner { ... }
interface Product { ... }
interface Order { ... }

// أنواع البيانات الثابتة
interface BusinessType { ... }
interface City { ... }
interface WorkingDay { ... }

// أنواع الاستجابات
interface UserAccountInfo { ... }
interface ApiResponse<T> { ... }
```

## كيفية التطبيق

### الخطوة 1: تحديث الاستيرادات
في جميع الملفات التي تستخدم Supabase، قم بتحديث الاستيراد:

```typescript
// القديم
import { supabase } from '../../lib/supabase';

// الجديد
import { 
  supabase, 
  getUserAccountInfo, 
  createUser, 
  createMerchant, 
  createStoreOwner 
} from '../../lib/supabase-updated';
```

### الخطوة 2: تحديث استعلامات قاعدة البيانات

#### مثال: التحقق من وجود المستخدم
```typescript
// القديم
const { data, error } = await supabase
  .rpc('get_user_account_info', { phone_input: phone });

// الجديد
const userInfo = await getUserAccountInfo(phone);
```

#### مثال: إنشاء مستخدم جديد
```typescript
// القديم
const { data, error } = await supabase
  .from('profiles')
  .insert([userData]);

// الجديد
const result = await createUser(userData);
if (result.success) {
  // المستخدم تم إنشاؤه بنجاح
  const user = result.data;
} else {
  // حدث خطأ
  console.error(result.error);
}
```

### الخطوة 3: تحديث نماذج التسجيل

#### نموذج التاجر:
```typescript
const merchantData = {
  user_id: userId,
  business_name: businessName,
  business_type: selectedBusinessType,
  nearest_landmark: nearestLandmark,
  city: selectedCity,
  region: selectedRegion,
  work_days: selectedWorkingDays.join(','),
  open_time: openingTime,
  close_time: closingTime,
  identity_image: identityImageUrl,
  store_image: storeImageUrl,
  latitude: location?.latitude,
  longitude: location?.longitude,
  abs: wantsAds
};

const result = await createMerchant(merchantData);
```

#### نموذج صاحب المحل:
```typescript
const storeOwnerData = {
  user_id: userId,
  store_name: storeName,
  store_type: selectedStoreType,
  address: address,
  nearest_landmark: nearestLandmark,
  work_days: selectedWorkingDays.join(','),
  open_time: openingTime,
  close_time: closingTime,
  storefront_image: storefrontImageUrl,
  latitude: location?.latitude,
  longitude: location?.longitude
};

const result = await createStoreOwner(storeOwnerData);
```

## البيانات الثابتة

### أنواع الأعمال:
```typescript
const businessTypes = await getBusinessTypes();
// Returns: [
//   { id: 1, name: 'food', name_ar: 'مواد غذائية' },
//   { id: 2, name: 'meat', name_ar: 'لحوم' },
//   ...
// ]
```

### المدن:
```typescript
const cities = await getCities();
// Returns: [
//   { id: 1, name: 'baghdad', name_ar: 'بغداد' },
//   { id: 2, name: 'basra', name_ar: 'البصرة' },
//   ...
// ]
```

### أيام العمل:
```typescript
const workingDays = await getWorkingDays();
// Returns: [
//   { id: 1, day_code: 'saturday', name_en: 'Saturday', name_ar: 'السبت' },
//   { id: 2, day_code: 'sunday', name_en: 'Sunday', name_ar: 'الأحد' },
//   ...
// ]
```

## معالجة الأخطاء

### مثال على معالجة الأخطاء:
```typescript
try {
  const result = await createUser(userData);
  
  if (result.success) {
    // نجح العملية
    console.log('User created:', result.data);
  } else {
    // فشلت العملية
    console.error('Error creating user:', result.error);
    
    if (result.error?.code === '23505') {
      // خطأ: رقم الهاتف موجود مسبقاً
      Alert.alert('خطأ', 'رقم الهاتف مسجل مسبقاً');
    } else {
      // خطأ عام
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء الحساب');
    }
  }
} catch (error) {
  console.error('Unexpected error:', error);
  Alert.alert('خطأ', 'حدث خطأ غير متوقع');
}
```

## التحقق من التطبيق

### 1. اختبار الاتصال:
```typescript
// في أي ملف
import { supabase } from '../../lib/supabase-updated';

const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Connection failed:', error);
    } else {
      console.log('Connection successful');
    }
  } catch (error) {
    console.error('Connection error:', error);
  }
};
```

### 2. اختبار إنشاء المستخدم:
```typescript
const testUserCreation = async () => {
  const userData = {
    full_name: 'Test User',
    phone_number: '+964123456789',
    user_type: 'merchant' as const
  };
  
  const result = await createUser(userData);
  console.log('User creation result:', result);
};
```

## نصائح مهمة

### 1. التحقق من البيانات:
```typescript
// تأكد من صحة البيانات قبل الإرسال
const validateUserData = (data: UserRegistrationData) => {
  if (!data.full_name.trim()) {
    throw new Error('الاسم مطلوب');
  }
  
  if (!data.phone_number.trim()) {
    throw new Error('رقم الهاتف مطلوب');
  }
  
  if (!['merchant', 'store_owner'].includes(data.user_type)) {
    throw new Error('نوع المستخدم غير صحيح');
  }
};
```

### 2. معالجة البيانات:
```typescript
// تحويل أيام العمل إلى نص
const formatWorkingDays = (days: string[]) => {
  return days.join(',');
};

// تحويل النص إلى أيام عمل
const parseWorkingDays = (daysText: string) => {
  return daysText.split(',').filter(day => day.trim());
};
```

### 3. إدارة الحالة:
```typescript
// استخدام React state لإدارة البيانات
const [userData, setUserData] = useState<UserRegistrationData>({
  full_name: '',
  phone_number: '',
  user_type: 'merchant'
});

const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

## استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في الاتصال:**
   - تحقق من إعدادات Supabase
   - تأكد من صحة URL والمفتاح

2. **خطأ في البيانات:**
   - تحقق من صحة نوع البيانات
   - تأكد من وجود جميع الحقول المطلوبة

3. **خطأ في الصلاحيات:**
   - تحقق من سياسات RLS
   - تأكد من صلاحيات المستخدم

### سجلات التصحيح:
```typescript
// إضافة سجلات مفصلة
console.log('User data:', userData);
console.log('API response:', result);
console.log('Error details:', error);
```

## الخلاصة

التحديث الجديد يوفر:
- ✅ **أداء أفضل** مع استعلامات محسنة
- ✅ **أمان محسن** مع صلاحيات دقيقة
- ✅ **سهولة الصيانة** مع كود منظم
- ✅ **دعم TypeScript** مع أنواع محددة
- ✅ **معالجة أخطاء محسنة** مع رسائل واضحة

تأكد من اختبار جميع الوظائف بعد التطبيق للتأكد من عملها بشكل صحيح. 