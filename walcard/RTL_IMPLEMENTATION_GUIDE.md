# دليل تطبيق RTL (من اليمين إلى اليسار)

## التحديثات المطبقة

### 1. ✅ إعدادات التطبيق
**الملف**: `walcard/app.json`
```json
{
  "expo": {
    "locales": {
      "ar": "./assets/locales/ar.json"
    },
    "ios": {
      "infoPlist": {
        "CFBundleDevelopmentRegion": "ar",
        "CFBundleLocalizations": ["ar"]
      }
    },
    "android": {
      "locale": "ar"
    }
  }
}
```

### 2. ✅ ملف اللغات العربية
**الملف**: `walcard/assets/locales/ar.json`
- يحتوي على جميع النصوص العربية
- يدعم الترجمة والموضعنة
- منظم حسب الأقسام (المنتجات، الطلبات، إلخ)

### 3. ✅ إعدادات RTL
**الملف**: `walcard/lib/rtl-config.ts`
```typescript
import { I18nManager } from 'react-native';

export const setupRTL = () => {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
};

export const getArabicTextStyles = () => ({
  textAlign: 'right',
  writingDirection: 'rtl',
  direction: 'rtl',
});
```

### 4. ✅ تفعيل RTL في التطبيق الرئيسي
**الملف**: `walcard/app/_layout.tsx`
```typescript
import { setupRTL } from '../lib/rtl-config';

export default function RootLayout() {
  useEffect(() => {
    setupRTL();
  }, []);
}
```

## كيفية تطبيق RTL على الملفات

### 1. إضافة أنماط النص العربي
```typescript
import { getArabicTextStyles } from '../../lib/rtl-config';

const styles = StyleSheet.create({
  text: {
    ...getArabicTextStyles(),
    fontSize: 16,
    color: '#333',
  },
});
```

### 2. تطبيق على النصوص
```typescript
<Text style={[styles.text, getArabicTextStyles()]}>
  النص العربي هنا
</Text>
```

### 3. تطبيق على Flexbox
```typescript
import { getRTLFlexStyles } from '../../lib/rtl-config';

<View style={[styles.container, getRTLFlexStyles()]}>
  <Text>النص من اليمين</Text>
  <Icon />
</View>
```

## الملفات التي تحتاج تحديث

### 1. الصفحات الرئيسية
- `walcard/app/store-owner/index.tsx`
- `walcard/app/store-owner/orders.tsx`
- `walcard/app/store-owner/search.tsx`
- `walcard/app/store-owner/favorites.tsx`
- `walcard/app/store-owner/profile.tsx`

### 2. صفحات التفاصيل
- `walcard/app/store-owner/(modals)/product-details.tsx`
- `walcard/app/store-owner/(modals)/order-details.tsx`
- `walcard/app/store-owner/cart.tsx`

### 3. صفحات المصادقة
- `walcard/app/auth/login.tsx`
- `walcard/app/auth/register.tsx`
- `walcard/app/auth/verify.tsx`

## خطوات التطبيق

### الخطوة 1: إعادة تشغيل التطبيق
```bash
npx expo start --clear
```

### الخطوة 2: تطبيق الأنماط
في كل ملف، أضف:
```typescript
import { getArabicTextStyles } from '../../lib/rtl-config';

// في الأنماط
const styles = StyleSheet.create({
  text: {
    ...getArabicTextStyles(),
    // باقي الأنماط
  },
});
```

### الخطوة 3: اختبار RTL
1. افتح التطبيق
2. تأكد من أن النصوص محاذاة لليمين
3. تأكد من أن الأيقونات في المكان الصحيح

## النتائج المتوقعة

### ✅ النصوص
- جميع النصوص محاذاة لليمين
- اتجاه الكتابة من اليمين لليسار
- خطوط عربية مناسبة

### ✅ التخطيط
- العناصر مرتبة من اليمين لليسار
- الأيقونات في الجانب الصحيح
- التنقل منطقي للغة العربية

### ✅ التفاعل
- أزرار التنقل في المكان الصحيح
- تجربة مستخدم مناسبة للعربية
- واجهة بديهية للمستخدمين العرب

## ملاحظات مهمة

### 1. الأيقونات
- تأكد من أن الأيقونات في الجانب الصحيح
- استخدم `flexDirection: 'row-reverse'` عند الحاجة

### 2. النصوص
- استخدم `textAlign: 'right'` لجميع النصوص
- تأكد من `writingDirection: 'rtl'`

### 3. التنقل
- أزرار الرجوع في الجانب الأيمن
- أزرار الإغلاق في الجانب الأيسر

### 4. الاختبار
- اختبر على أجهزة مختلفة
- تأكد من التوافق مع iOS و Android
- اختبر مع نصوص طويلة وقصيرة

## الملفات المحدثة

1. `walcard/app.json` - إعدادات RTL
2. `walcard/assets/locales/ar.json` - ملف اللغات
3. `walcard/lib/rtl-config.ts` - إعدادات RTL
4. `walcard/app/_layout.tsx` - تفعيل RTL

## الخطوات التالية

1. تطبيق الأنماط على جميع الملفات
2. اختبار التطبيق على أجهزة مختلفة
3. التأكد من التوافق مع جميع الشاشات
4. تحسين تجربة المستخدم للغة العربية 