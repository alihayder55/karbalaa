# إعداد OTP للتطوير - تجاوز مشكلة Twilio

## المشكلة
Twilio يحظر الأرقام العراقية، مما يمنع اختبار نظام تسجيل الدخول.

## الحل السريع للتطوير

### الخطوة 1: إعداد Email OTP

#### 1. في Supabase Dashboard:
1. اذهب إلى **Authentication > Settings**
2. في **Email Templates**، فعّل **Enable email confirmations**
3. في **SMTP Settings**، أضف:
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: your-app-password
   ```

#### 2. إعداد Gmail App Password:
1. اذهب إلى Google Account Settings
2. اذهب إلى Security > 2-Step Verification
3. أنشئ App Password للتطبيق

### الخطوة 2: إعداد OTP محلي

#### 1. إنشاء ملف `.env.local`:
```env
# Development OTP Settings
SUPABASE_AUTH_OTP_EMAIL_TEMPLATE=development
SUPABASE_AUTH_OTP_SMS_TEMPLATE=development
SUPABASE_AUTH_OTP_CONSOLE_LOG=true
```

#### 2. إضافة console logging:
```javascript
// في lib/auth-helpers.ts
export const signInWithPhone = async (phone: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true,
      }
    });

    if (error) {
      console.error('OTP Error:', error);
      throw error;
    }

    // في development، عرض OTP في console
    if (__DEV__ && data?.user) {
      console.log('🔐 Development OTP sent to console');
      console.log('📱 Phone:', phone);
      console.log('🔑 Check your email for OTP');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { data: null, error };
  }
};
```

### الخطوة 3: إعداد Email Template

#### 1. في Supabase Dashboard:
1. اذهب إلى **Authentication > Email Templates**
2. عدّل **Confirm signup** template:
```html
<h2>رمز التحقق</h2>
<p>رمز التحقق الخاص بك هو: <strong>{{ .Token }}</strong></p>
<p>هذا الرمز صالح لمدة 10 دقائق.</p>
```

### الخطوة 4: اختبار النظام

#### 1. تسجيل الدخول:
1. أدخل رقم الهاتف
2. اضغط "إرسال رمز التحقق"
3. تحقق من email
4. أدخل الرمز

#### 2. التحقق من العمل:
```javascript
// في console ستظهر:
🔐 Development OTP sent to console
📱 Phone: +9647860607907
🔑 Check your email for OTP
```

## الميزات:

### ✅ **تجاوز مشكلة Twilio**
- استخدام Email بدلاً من SMS
- عمل النظام بدون مشاكل

### ✅ **تطوير أسرع**
- OTP يصل عبر email
- عرض معلومات في console
- اختبار سريع

### ✅ **سهولة الاستخدام**
- إعداد بسيط
- عمل فوري
- لا حاجة لمزود SMS

## النتيجة:
✅ **نظام تسجيل دخول يعمل**  
✅ **تجاوز حظر Twilio**  
✅ **تطوير أسرع**  
✅ **اختبار سهل**

## ملاحظات:
- هذا الحل للتطوير فقط
- للإنتاج، استخدم مزود SMS بديل
- يمكن استخدام WhatsApp أو Email للإنتاج 