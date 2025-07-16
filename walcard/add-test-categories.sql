-- إضافة فئات تجريبية للاختبار
INSERT INTO product_categories (id, name, description, image_URL, parent_id, created_at) VALUES
('cat-1', 'الإلكترونيات', 'أجهزة إلكترونية وملحقاتها', NULL, NULL, NOW()),
('cat-2', 'الملابس', 'ملابس رجالية ونسائية وأطفال', NULL, NULL, NOW()),
('cat-3', 'الأحذية', 'أحذية رياضية وعادية', NULL, NULL, NOW()),
('cat-4', 'الأثاث', 'أثاث منزلي ومكتبي', NULL, NULL, NOW()),
('cat-5', 'الأدوات', 'أدوات منزلية ومكتبية', NULL, NULL, NOW()),
('cat-6', 'الطعام', 'مواد غذائية ومشروبات', NULL, NULL, NOW()),
('cat-7', 'المنظفات', 'منظفات منزلية وصناعية', NULL, NULL, NOW()),
('cat-8', 'الألعاب', 'ألعاب أطفال وإلكترونية', NULL, NULL, NOW());

-- إضافة فئات فرعية تجريبية
INSERT INTO product_categories (id, name, description, image_URL, parent_id, created_at) VALUES
('subcat-1', 'هواتف ذكية', 'هواتف محمولة ذكية', NULL, 'cat-1', NOW()),
('subcat-2', 'لابتوب', 'حواسيب محمولة', NULL, 'cat-1', NOW()),
('subcat-3', 'ملابس رجالية', 'ملابس للرجال', NULL, 'cat-2', NOW()),
('subcat-4', 'ملابس نسائية', 'ملابس للنساء', NULL, 'cat-2', NOW()),
('subcat-5', 'أحذية رياضية', 'أحذية رياضية', NULL, 'cat-3', NOW()),
('subcat-6', 'أثاث غرف النوم', 'أثاث غرف النوم', NULL, 'cat-4', NOW());

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