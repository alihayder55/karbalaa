-- إضافة فئات تجريبية لاختبار النظام
-- يمكن تشغيل هذا الملف في Supabase SQL Editor

-- حذف الفئات الموجودة (اختياري)
-- DELETE FROM product_categories;

-- إضافة فئات رئيسية
INSERT INTO product_categories (id, name, description, parent_id, created_at, updated_at) VALUES
('cat-001', 'الإلكترونيات', 'الأجهزة الإلكترونية والكهربائية', NULL, NOW(), NOW()),
('cat-002', 'الملابس', 'ملابس رجالية ونسائية وأطفال', NULL, NOW(), NOW()),
('cat-003', 'المنزل والحديقة', 'مستلزمات المنزل والحديقة', NULL, NOW(), NOW()),
('cat-004', 'الرياضة', 'معدات رياضية وملابس رياضية', NULL, NOW(), NOW()),
('cat-005', 'الكتب والقرطاسية', 'كتب وقرطاسية ومستلزمات مكتبية', NULL, NOW(), NOW());

-- إضافة فئات فرعية للإلكترونيات
INSERT INTO product_categories (id, name, description, parent_id, created_at, updated_at) VALUES
('cat-001-001', 'الهواتف الذكية', 'هواتف ذكية وأجهزة محمولة', 'cat-001', NOW(), NOW()),
('cat-001-002', 'الحواسيب', 'حواسيب محمولة وطاولية', 'cat-001', NOW(), NOW()),
('cat-001-003', 'الأجهزة المنزلية', 'أجهزة منزلية كهربائية', 'cat-001', NOW(), NOW());

-- إضافة فئات فرعية للملابس
INSERT INTO product_categories (id, name, description, parent_id, created_at, updated_at) VALUES
('cat-002-001', 'ملابس رجالية', 'ملابس للرجال', 'cat-002', NOW(), NOW()),
('cat-002-002', 'ملابس نسائية', 'ملابس للنساء', 'cat-002', NOW(), NOW()),
('cat-002-003', 'ملابس أطفال', 'ملابس للأطفال', 'cat-002', NOW(), NOW());

-- إضافة فئات فرعية للمنزل والحديقة
INSERT INTO product_categories (id, name, description, parent_id, created_at, updated_at) VALUES
('cat-003-001', 'الأثاث', 'أثاث منزلي ومكتبي', 'cat-003', NOW(), NOW()),
('cat-003-002', 'الإضاءة', 'إضاءة منزلية ومكتبية', 'cat-003', NOW(), NOW()),
('cat-003-003', 'الحديقة', 'مستلزمات الحدائق والنباتات', 'cat-003', NOW(), NOW());

-- إضافة فئات فرعية للرياضة
INSERT INTO product_categories (id, name, description, parent_id, created_at, updated_at) VALUES
('cat-004-001', 'معدات رياضية', 'معدات وأجهزة رياضية', 'cat-004', NOW(), NOW()),
('cat-004-002', 'ملابس رياضية', 'ملابس رياضية للرجال والنساء', 'cat-004', NOW(), NOW()),
('cat-004-003', 'أحذية رياضية', 'أحذية رياضية ومشي', 'cat-004', NOW(), NOW());

-- إضافة فئات فرعية للكتب والقرطاسية
INSERT INTO product_categories (id, name, description, parent_id, created_at, updated_at) VALUES
('cat-005-001', 'الكتب', 'كتب تعليمية وترفيهية', 'cat-005', NOW(), NOW()),
('cat-005-002', 'القرطاسية', 'أقلام ودفاتر ومستلزمات مكتبية', 'cat-005', NOW(), NOW()),
('cat-005-003', 'الألعاب التعليمية', 'ألعاب تعليمية للأطفال', 'cat-005', NOW(), NOW());

-- التحقق من إضافة الفئات
SELECT 
  id,
  name,
  description,
  parent_id,
  CASE 
    WHEN parent_id IS NULL THEN 'فئة رئيسية'
    ELSE 'فئة فرعية'
  END as category_type
FROM product_categories 
ORDER BY parent_id NULLS FIRST, name; 