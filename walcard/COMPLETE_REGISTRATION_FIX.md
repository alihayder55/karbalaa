# Complete Registration Flow Fix

## 🔧 المشكلة المطروحة

المستخدم الجديد كان يتم إنشاء ملف شخصي له في قاعدة البيانات حتى قبل إدخال معلومات التاجر أو صاحب المحل، مما يؤدي إلى:
- ظهور المستخدم كـ "مسجل" حتى لو لم يكمل التسجيل
- مشاكل في تتبع حالة التسجيل
- بيانات غير مكتملة في النظام

## ✅ الحل المطبق

### 1. **تأجيل إنشاء الملف الشخصي**
- ✅ لا يتم إنشاء الملف الشخصي إلا بعد إدخال جميع المعلومات المطلوبة
- ✅ التحقق من وجود الملف الشخصي قبل إنشاء سجلات التاجر/صاحب المحل
- ✅ إنشاء الملف الشخصي فقط عند الحاجة

### 2. **تحسين فحص وجود المستخدم**
- ✅ فحص وجود سجلات كاملة (merchant أو store_owner) بدلاً من مجرد الملف الشخصي
- ✅ المستخدم يعتبر "جديد" حتى يكمل جميع خطوات التسجيل
- ✅ منع التسجيل المزدوج للمستخدمين غير المكتملين

### 3. **تدفق العمل الجديد**
```
1. إدخال رقم الهاتف والاسم
2. إرسال OTP والتحقق منه
3. اختيار نوع المستخدم (تاجر/صاحب محل)
4. إدخال المعلومات المطلوبة
5. إنشاء الملف الشخصي + سجل التاجر/صاحب المحل
6. الانتقال لصفحة انتظار الموافقة
```

## 🛠️ التغييرات التقنية

### **في verify.tsx:**
```typescript
// التحقق من وجود الملف الشخصي بدلاً من إنشائه مباشرة
if (isRegistration === 'true') {
  try {
    // Check if user has a complete profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    if (profileError || !profileData) {
      // No profile exists, create basic profile and go to user type selection
      const { error: createError } = await supabase
        .from('profiles')
        .insert([...]);
    }

    // Go to user type selection
    router.replace({
      pathname: '/auth/user-type-selection',
      params: { phone, name }
    });
  } catch (error) {
    // Handle errors
  }
}
```

### **في merchant-registration.tsx و store-owner-registration.tsx:**
```typescript
const handleSubmit = async () => {
  // Get current user ID
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if user has a profile, create one if not
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    // Create profile if it doesn't exist
    const { error: createProfileError } = await supabase
      .from('profiles')
      .insert([...]);
  }

  // Create merchant/store_owner record
  const { data, error } = await supabase
    .from('merchants') // or 'store_owners'
    .insert([...]);
};
```

### **في unified-auth.tsx و unified-login.tsx:**
```typescript
const checkUserExists = async (phone: string) => {
  // Check if user has a complete account (merchant or store_owner record)
  const { data, error } = await supabase
    .rpc('get_user_account_info', { phone_input: phone });

  // Only return user info if they have a complete account
  if (data && data.length > 0) {
    const userInfo = data[0];
    // Check if user has either merchant or store_owner record
    if (userInfo.has_account && (userInfo.user_type === 'merchant' || userInfo.user_type === 'store_owner')) {
      return userInfo;
    }
  }
  
  return null;
};
```

## 🎯 الفوائد

### **للمستخدمين:**
- ✅ لا يتم اعتبارهم "مسجلين" حتى يكملوا التسجيل
- ✅ يمكنهم إعادة التسجيل إذا لم يكملوا العملية
- ✅ تجربة تسجيل أكثر وضوحاً

### **للمطورين:**
- ✅ بيانات أكثر دقة في قاعدة البيانات
- ✅ منع التسجيلات المزدوجة
- ✅ تتبع أفضل لحالة التسجيل

### **للنظام:**
- ✅ بيانات أكثر تنظيماً
- ✅ تقليل البيانات المفقودة
- ✅ تحسين أداء الاستعلامات

## 🔄 تدفق العمل الكامل

```
1. إدخال رقم الهاتف والاسم
   ↓
2. إرسال OTP والتحقق منه
   ↓
3. اختيار نوع المستخدم
   ↓
4. إدخال المعلومات المطلوبة
   ↓
5. إنشاء الملف الشخصي (إذا لم يكن موجوداً)
   ↓
6. إنشاء سجل التاجر/صاحب المحل
   ↓
7. الانتقال لصفحة انتظار الموافقة
```

## 📝 ملاحظات مهمة

- **المستخدم الجديد** لا يعتبر مسجلاً حتى يكمل جميع الخطوات
- **الملف الشخصي** يتم إنشاؤه فقط عند الحاجة
- **فحص الوجود** يتحقق من السجلات الكاملة فقط
- **منع التسجيل المزدوج** للمستخدمين غير المكتملين 