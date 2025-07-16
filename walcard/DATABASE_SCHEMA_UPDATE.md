# تحديث قاعدة البيانات - إزالة عمود الكمية

## التغيير المطبق

تم تحديث جدول `products` في قاعدة البيانات لإزالة عمود `available_quantity` واستخدام `is_active` فقط لتحديد حالة التوفر.

### الجدول الجديد:
```sql
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  merchant_id uuid NULL,
  category_id uuid NULL,
  unit_id uuid NULL,
  name text NOT NULL,
  description text NULL,
  price numeric(12, 2) NOT NULL,
  discount_price numeric(12, 2) NULL,
  image_url text NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES product_categories (id),
  CONSTRAINT products_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES merchants (user_id),
  CONSTRAINT products_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES unit (id)
);
```

## التغييرات في الكود

### 1. واجهات البيانات (Interfaces)
- ✅ تحديث `CartItem` لاستخدام `is_active` بدلاً من `available_quantity`
- ✅ تحديث `Product` في جميع الصفحات
- ✅ تحديث `FavoriteProduct` في صفحة المفضلة

### 2. استعلامات قاعدة البيانات
- ✅ تحديث جميع الاستعلامات لاستخدام `is_active`
- ✅ إزالة مراجع `available_quantity` من جميع الاستعلامات
- ✅ إضافة فلتر `is_active = true` للمنتجات المتوفرة

### 3. عرض حالة التوفر
- ✅ تحديث جميع الصفحات لاستخدام `is_active` لتحديد التوفر
- ✅ المنتجات مع `is_active = true` تعتبر متوفرة
- ✅ المنتجات مع `is_active = false` تعتبر غير متوفرة

### 4. مدير السلة
- ✅ إزالة التحقق من الكمية المتوفرة
- ✅ التحقق من `is_active` فقط
- ✅ إزالة تحديث المخزون

## الصفحات المحدثة

### 1. الصفحة الرئيسية (`index.tsx`)
- ✅ تحديث واجهة `Product`
- ✅ تحديث استعلام المنتجات
- ✅ تحديث عرض حالة التوفر

### 2. صفحة السلة (`cart.tsx`)
- ✅ تحديث عرض حالة التوفر
- ✅ إزالة مراجع الكمية

### 3. تفاصيل المنتج (`product-details.tsx`)
- ✅ تحديث واجهة `Product`
- ✅ تحديث استعلام المنتج
- ✅ تحديث عرض حالة التوفر
- ✅ إزالة التحقق من الكمية

### 4. صفحة المفضلة (`favorites.tsx`)
- ✅ تحديث واجهة `FavoriteProduct`
- ✅ تحديث عرض حالة التوفر

### 5. صفحة البحث (`search.tsx`)
- ✅ تحديث واجهة `Product`
- ✅ تحديث استعلامات البحث
- ✅ تحديث عرض حالة التوفر

### 6. مدير السلة (`cart-manager.ts`)
- ✅ تحديث واجهة `CartItem`
- ✅ إزالة التحقق من الكمية
- ✅ التحقق من `is_active` فقط

## النتائج

### قبل التغيير:
- استخدام `available_quantity` لتحديد التوفر
- عرض الكمية المتبقية
- التحقق من الكمية عند الإضافة

### بعد التغيير:
- ✅ استخدام `is_active` لتحديد التوفر
- ✅ عرض "متوفر" أو "غير متوفر" فقط
- ✅ لا توجد قيود كمية
- ✅ تصميم أبسط وأوضح

## الملفات المحدثة

1. `walcard/lib/cart-manager.ts` - مدير السلة
2. `walcard/app/store-owner/index.tsx` - الصفحة الرئيسية
3. `walcard/app/store-owner/cart.tsx` - صفحة السلة
4. `walcard/app/store-owner/(modals)/product-details.tsx` - تفاصيل المنتج
5. `walcard/app/store-owner/favorites.tsx` - صفحة المفضلة
6. `walcard/app/store-owner/search.tsx` - صفحة البحث

## ملاحظات مهمة

- تم الاحتفاظ بجميع الوظائف الأخرى
- تم إزالة التعقيدات المتعلقة بإدارة المخزون
- التصميم أصبح أبسط وأوضح
- الأداء تحسن بسبب إزالة التحققات المعقدة 