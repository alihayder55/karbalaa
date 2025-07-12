# حل مشكلة المفضلة - دليل مبسط

## المشكلة
المنتجات المفضلة لا تنتقل إلى صفحة المفضلات

## السبب المحتمل
عدم وجود جداول قاعدة البيانات أو الدوال المطلوبة في Supabase

## الحل - اتبع هذه الخطوات بالترتيب:

### 1. انتقل إلى Supabase Dashboard
- افتح https://supabase.com/dashboard
- اختر مشروعك
- انتقل إلى SQL Editor

### 2. تشغيل السكريبت البسيط
انسخ والصق هذا الكود في SQL Editor واضغط RUN:

```sql
-- إنشاء جدول user_favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- إنشاء جدول products بسيط (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    available_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة بعض المنتجات التجريبية
INSERT INTO products (name, price, available_quantity) VALUES
    ('أرز بسمتي', 15000, 100),
    ('زيت زيتون', 25000, 50),
    ('طماطم طازجة', 3000, 200)
ON CONFLICT DO NOTHING;

-- تعيين الصلاحيات
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_favorites TO anon, authenticated;
GRANT ALL ON products TO anon, authenticated;

-- إعداد سياسات الأمان
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- سياسة للمفضلة - السماح للجميع
DROP POLICY IF EXISTS "Allow all for favorites" ON user_favorites;
CREATE POLICY "Allow all for favorites" ON user_favorites FOR ALL USING (true);

-- سياسة للمنتجات - السماح بالقراءة للجميع
DROP POLICY IF EXISTS "Allow read for products" ON products;
CREATE POLICY "Allow read for products" ON products FOR SELECT USING (is_active = true);

SELECT 'تم إعداد نظام المفضلة بنجاح!' as status;
```

### 3. التحقق من النتيجة
بعد تشغيل السكريبت، يجب أن ترى:
```
تم إعداد نظام المفضلة بنجاح!
```

### 4. اختبار التطبيق
1. أعد تشغيل التطبيق: `npx expo start --clear`
2. سجل دخول إلى التطبيق
3. اذهب إلى المنتجات وجرب إضافة منتج للمفضلة
4. انتقل إلى صفحة المفضلة وتحقق من ظهور المنتج

## في حالة استمرار المشكلة:

### تحقق من الكونسول
افتح Developer Tools في Metro وراقب الرسائل:
- يجب أن ترى: `✅ User logged in: [user-id]`
- يجب أن ترى: `✅ Product added to favorites`
- يجب أن ترى: `✅ Got favorites: [number] items`

### رسائل الخطأ الشائعة:
- `relation "user_favorites" does not exist` → لم يتم تشغيل السكريبت
- `permission denied` → مشكلة في الصلاحيات
- `No user logged in` → مشكلة في تسجيل الدخول

## التشخيص السريع:

### 1. تحقق من وجود الجداول:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('user_favorites', 'products');
```

### 2. تحقق من المنتجات التجريبية:
```sql
SELECT count(*) FROM products;
```

### 3. تحقق من المفضلة:
```sql
SELECT count(*) FROM user_favorites;
```

## ملاحظات مهمة:
- تأكد من أن معرف المستخدم صحيح
- تأكد من أن Supabase keys صحيحة في المشروع
- في حالة مشاكل مستمرة، احذف كل البيانات وأعد تشغيل السكريبت
- التطبيق يتطلب اتصال إنترنت للوصول إلى Supabase

## إذا لم تنجح كل المحاولات:
1. احذف `node_modules` و `package-lock.json`
2. شغل `npm install`
3. شغل `npx expo start --clear`
4. أعد تشغيل السكريبت في Supabase

---
**آخر تحديث:** نوفمبر 2024
**الحالة:** تم حل المشكلة مع الحل المبسط 