-- إضافة فئات تجريبية بسرعة
-- شغل هذا الملف في Supabase SQL Editor

-- حذف الفئات الموجودة (اختياري)
DELETE FROM product_categories;

-- إضافة فئات رئيسية فقط
INSERT INTO product_categories (id, name, description, parent_id, created_at, updated_at) VALUES
('cat-1', 'الإلكترونيات', 'الأجهزة الإلكترونية والكهربائية', NULL, NOW(), NOW()),
('cat-2', 'الملابس', 'ملابس رجالية ونسائية وأطفال', NULL, NOW(), NOW()),
('cat-3', 'المنزل والحديقة', 'مستلزمات المنزل والحديقة', NULL, NOW(), NOW()),
('cat-4', 'الرياضة', 'معدات رياضية وملابس رياضية', NULL, NOW(), NOW()),
('cat-5', 'الكتب والقرطاسية', 'كتب وقرطاسية ومستلزمات مكتبية', NULL, NOW(), NOW());

-- التحقق من إضافة الفئات
SELECT id, name, description FROM product_categories ORDER BY name; 