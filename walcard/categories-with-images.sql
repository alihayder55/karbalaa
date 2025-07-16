-- تحديث قاعدة البيانات لدعم صور الفئات والفئات الفرعية
-- إضافة عمود image_url إلى جدول product_categories

-- إضافة عمود image_url إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_categories' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE product_categories ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- إضافة عمود name_ar إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_categories' 
        AND column_name = 'name_ar'
    ) THEN
        ALTER TABLE product_categories ADD COLUMN name_ar TEXT;
    END IF;
END $$;

-- إضافة عمود parent_id إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_categories' 
        AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE product_categories ADD COLUMN parent_id UUID REFERENCES product_categories(id);
    END IF;
END $$;

-- إنشاء فئات رئيسية مع صور
INSERT INTO product_categories (id, name, name_ar, description, image_url, parent_id) VALUES
-- فئات رئيسية
('cat-001', 'Electronics', 'الإلكترونيات', 'جميع الأجهزة الإلكترونية والكهربائية', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', NULL),
('cat-002', 'Clothing', 'الملابس', 'ملابس رجالية ونسائية وأطفال', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', NULL),
('cat-003', 'Home & Garden', 'المنزل والحديقة', 'مستلزمات المنزل والحديقة', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', NULL),
('cat-004', 'Sports & Outdoors', 'الرياضة والهواء الطلق', 'معدات رياضية وملابس رياضية', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', NULL),
('cat-005', 'Beauty & Health', 'الجمال والصحة', 'مستحضرات تجميل ومنتجات صحية', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', NULL),
('cat-006', 'Books & Media', 'الكتب والوسائط', 'كتب ومجلات وأفلام وموسيقى', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', NULL),
('cat-007', 'Automotive', 'السيارات', 'قطع غيار السيارات وملحقاتها', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400', NULL),
('cat-008', 'Toys & Games', 'الألعاب والدمى', 'ألعاب ودمى للأطفال', 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400', NULL)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    parent_id = EXCLUDED.parent_id;

-- إنشاء فئات فرعية للإلكترونيات
INSERT INTO product_categories (id, name, name_ar, description, image_url, parent_id) VALUES
('cat-001-001', 'Smartphones', 'الهواتف الذكية', 'هواتف ذكية وملحقاتها', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 'cat-001'),
('cat-001-002', 'Laptops', 'الحواسيب المحمولة', 'حواسيب محمولة وملحقاتها', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', 'cat-001'),
('cat-001-003', 'Tablets', 'الأجهزة اللوحية', 'أجهزة لوحية وملحقاتها', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', 'cat-001'),
('cat-001-004', 'Accessories', 'الملحقات', 'ملحقات إلكترونية متنوعة', 'https://images.unsplash.com/photo-1544866092-1677b00f868b?w=400', 'cat-001')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    parent_id = EXCLUDED.parent_id;

-- إنشاء فئات فرعية للملابس
INSERT INTO product_categories (id, name, name_ar, description, image_url, parent_id) VALUES
('cat-002-001', 'Men Clothing', 'ملابس رجالية', 'ملابس للرجال', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', 'cat-002'),
('cat-002-002', 'Women Clothing', 'ملابس نسائية', 'ملابس للنساء', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', 'cat-002'),
('cat-002-003', 'Kids Clothing', 'ملابس أطفال', 'ملابس للأطفال', 'https://images.unsplash.com/photo-1503919545889-bef636e2d8b9?w=400', 'cat-002'),
('cat-002-004', 'Shoes', 'الأحذية', 'أحذية لجميع الأعمار', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', 'cat-002')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    parent_id = EXCLUDED.parent_id;

-- إنشاء فئات فرعية للمنزل والحديقة
INSERT INTO product_categories (id, name, name_ar, description, image_url, parent_id) VALUES
('cat-003-001', 'Furniture', 'الأثاث', 'أثاث منزلي ومكتبي', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', 'cat-003'),
('cat-003-002', 'Kitchen & Dining', 'المطبخ والطعام', 'أدوات مطبخ وأواني', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', 'cat-003'),
('cat-003-003', 'Garden Tools', 'أدوات الحديقة', 'أدوات ومعدات حديقة', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400', 'cat-003'),
('cat-003-004', 'Home Decor', 'ديكور المنزل', 'إكسسوارات وتزيين المنزل', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', 'cat-003')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    parent_id = EXCLUDED.parent_id;

-- إنشاء فئات فرعية للرياضة
INSERT INTO product_categories (id, name, name_ar, description, image_url, parent_id) VALUES
('cat-004-001', 'Fitness Equipment', 'معدات اللياقة', 'معدات رياضية للجيم', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', 'cat-004'),
('cat-004-002', 'Team Sports', 'الرياضات الجماعية', 'معدات كرة القدم والسلة', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', 'cat-004'),
('cat-004-003', 'Outdoor Sports', 'الرياضات الخارجية', 'معدات التخييم والمشي', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', 'cat-004'),
('cat-004-004', 'Sports Clothing', 'الملابس الرياضية', 'ملابس رياضية', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', 'cat-004')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    parent_id = EXCLUDED.parent_id;

-- إنشاء فئات فرعية للجمال والصحة
INSERT INTO product_categories (id, name, name_ar, description, image_url, parent_id) VALUES
('cat-005-001', 'Skincare', 'العناية بالبشرة', 'منتجات العناية بالبشرة', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', 'cat-005'),
('cat-005-002', 'Makeup', 'المكياج', 'مستحضرات تجميل', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', 'cat-005'),
('cat-005-003', 'Hair Care', 'العناية بالشعر', 'منتجات العناية بالشعر', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', 'cat-005'),
('cat-005-004', 'Health & Wellness', 'الصحة والعافية', 'مكملات غذائية وفيتامينات', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', 'cat-005')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    parent_id = EXCLUDED.parent_id;

-- إنشاء فئات فرعية للكتب والوسائط
INSERT INTO product_categories (id, name, name_ar, description, image_url, parent_id) VALUES
('cat-006-001', 'Books', 'الكتب', 'كتب متنوعة', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', 'cat-006'),
('cat-006-002', 'Magazines', 'المجلات', 'مجلات ودوريات', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', 'cat-006'),
('cat-006-003', 'Movies & TV', 'الأفلام والتلفاز', 'أفلام ومسلسلات', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', 'cat-006'),
('cat-006-004', 'Music', 'الموسيقى', 'ألبومات وموسيقى', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', 'cat-006')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    parent_id = EXCLUDED.parent_id;

-- إنشاء فئات فرعية للسيارات
INSERT INTO product_categories (id, name, name_ar, description, image_url, parent_id) VALUES
('cat-007-001', 'Car Parts', 'قطع غيار السيارات', 'قطع غيار متنوعة', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400', 'cat-007'),
('cat-007-002', 'Car Accessories', 'ملحقات السيارات', 'إكسسوارات السيارات', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400', 'cat-007'),
('cat-007-003', 'Car Care', 'العناية بالسيارة', 'منتجات تنظيف وصيانة', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400', 'cat-007'),
('cat-007-004', 'Motorcycle', 'الدراجات النارية', 'قطع غيار الدراجات', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400', 'cat-007')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    parent_id = EXCLUDED.parent_id;

-- إنشاء فئات فرعية للألعاب
INSERT INTO product_categories (id, name, name_ar, description, image_url, parent_id) VALUES
('cat-008-001', 'Board Games', 'ألعاب الطاولة', 'ألعاب طاولة تعليمية', 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400', 'cat-008'),
('cat-008-002', 'Puzzles', 'الألغاز', 'ألغاز وألعاب ذكاء', 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400', 'cat-008'),
('cat-008-003', 'Educational Toys', 'الألعاب التعليمية', 'ألعاب تعليمية للأطفال', 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400', 'cat-008'),
('cat-008-004', 'Dolls & Action Figures', 'الدمى والشخصيات', 'دمى وشخصيات كرتونية', 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400', 'cat-008')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    parent_id = EXCLUDED.parent_id;

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON product_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);
CREATE INDEX IF NOT EXISTS idx_product_categories_name_ar ON product_categories(name_ar);

-- عرض الفئات المحدثة
SELECT 
    id,
    name,
    name_ar,
    description,
    image_url,
    parent_id,
    CASE 
        WHEN parent_id IS NULL THEN 'فئة رئيسية'
        ELSE 'فئة فرعية'
    END as category_type
FROM product_categories 
ORDER BY parent_id NULLS FIRST, name; 