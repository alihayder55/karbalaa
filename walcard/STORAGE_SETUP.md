# إعداد Supabase Storage لـ Walcard

## الخطوات المطلوبة

### 1. إنشاء Storage Bucket في Supabase

1. اذهب إلى لوحة تحكم Supabase
2. اختر مشروعك
3. اذهب إلى Storage في القائمة الجانبية
4. انقر على "New bucket"
5. أدخل التفاصيل التالية:
   - **Name**: `forstore`
   - **Public bucket**: ✅ (مفعل)
   - **File size limit**: `50MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/heic`

### 2. تشغيل SQL Script

1. اذهب إلى SQL Editor في Supabase
2. انسخ محتوى ملف `supabase-storage-setup.sql`
3. شغل الكود لإنشاء السياسات والوظائف المطلوبة

### 3. إعداد RLS (Row Level Security)

تأكد من تفعيل RLS على جدول `storage.objects`:

```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### 4. هيكل المجلدات

سيتم إنشاء المجلدات التالية تلقائياً عند رفع الصور:

```
forstore/
├── store-images/
│   └── {user_id}/
│       └── store_{timestamp}.jpg
├── identity-images/
│   └── {user_id}/
│       └── identity_{timestamp}.jpg
├── business-images/
│   └── {user_id}/
│       └── business_{timestamp}.jpg
└── merchant-store-images/
    └── {user_id}/
        └── merchant_store_{timestamp}.jpg
```

### 5. السياسات المطبقة

#### للمستخدمين العاديين:
- يمكن رفع الصور الخاصة بهم
- يمكن عرض الصور الخاصة بهم
- يمكن تحديث وحذف الصور الخاصة بهم

#### للجمهور:
- يمكن عرض صور المتاجر (ليراها العملاء)

#### للمشرفين:
- وصول كامل لجميع الصور

### 6. اختبار الرفع

بعد الإعداد، يمكنك اختبار رفع الصور من التطبيق:

1. سجل دخول كصاحب محل
2. املأ نموذج التسجيل
3. اختر صورة للمتجر
4. أرسل النموذج
5. تحقق من رفع الصورة في Supabase Storage

### 7. استكشاف الأخطاء

إذا واجهت مشاكل:

1. **خطأ في الأذونات**: تأكد من تشغيل SQL script
2. **خطأ في حجم الملف**: تأكد من أن الصورة أقل من 50MB
3. **خطأ في نوع الملف**: تأكد من أن الصورة بصيغة مدعومة
4. **خطأ في الاتصال**: تحقق من إعدادات Supabase

### 8. مراقبة الاستخدام

يمكنك مراقبة استخدام Storage من:
- لوحة تحكم Supabase > Storage
- سجلات الاستخدام
- إحصائيات التخزين

### 9. النسخ الاحتياطي

يُنصح بإعداد نسخ احتياطي للصور المهمة:
- استخدم Supabase Backups
- أو اربط مع خدمة تخزين خارجية

### 10. الأمان

- جميع الصور محمية بـ RLS
- كل مستخدم يمكنه الوصول فقط لصوره
- صور المتاجر متاحة للجمهور للعرض فقط 