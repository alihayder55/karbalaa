-- Default data for Walcard app
-- This file contains the initial data needed for the app to function

-- Insert default units
INSERT INTO unit (unit) VALUES
    ('unit'),
    ('kg'),
    ('gram'),
    ('liter'),
    ('piece'),
    ('box'),
    ('pack'),
    ('bottle'),
    ('can'),
    ('bag')
ON CONFLICT (unit) DO NOTHING;

-- Insert default product categories
INSERT INTO product_categories (name, description) VALUES
    ('groceries', 'مواد غذائية أساسية'),
    ('fresh_produce', 'خضروات وفواكه طازجة'),
    ('dairy_products', 'منتجات الألبان'),
    ('meat_poultry', 'لحوم ودواجن'),
    ('beverages', 'مشروبات'),
    ('household', 'منتجات منزلية'),
    ('personal_care', 'العناية الشخصية'),
    ('electronics', 'إلكترونيات'),
    ('clothing', 'ملابس'),
    ('pharmacy', 'أدوية ومستلزمات طبية')
ON CONFLICT (name) DO NOTHING;

-- Insert default subcategories
INSERT INTO subcategories (category_id, name) 
SELECT 
    pc.id,
    sub.name
FROM product_categories pc
CROSS JOIN (
    VALUES 
        ('أرز وبقوليات'),
        ('زيت ودهون'),
        ('سكر وملح'),
        ('بهارات وتوابل'),
        ('معكرونة'),
        ('حبوب الإفطار'),
        ('مكسرات'),
        ('حلويات'),
        ('معلبات'),
        ('أخرى')
) AS sub(name)
WHERE pc.name = 'groceries'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO subcategories (category_id, name) 
SELECT 
    pc.id,
    sub.name
FROM product_categories pc
CROSS JOIN (
    VALUES 
        ('طماطم'),
        ('بصل'),
        ('بطاطس'),
        ('جزر'),
        ('خيار'),
        ('فلفل'),
        ('تفاح'),
        ('موز'),
        ('برتقال'),
        ('عنب'),
        ('فراولة'),
        ('أخرى')
) AS sub(name)
WHERE pc.name = 'fresh_produce'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO subcategories (category_id, name) 
SELECT 
    pc.id,
    sub.name
FROM product_categories pc
CROSS JOIN (
    VALUES 
        ('حليب'),
        ('جبن'),
        ('زبدة'),
        ('كريمة'),
        ('زبادي'),
        ('قشدة'),
        ('جبنة بيضاء'),
        ('جبنة صفراء'),
        ('أخرى')
) AS sub(name)
WHERE pc.name = 'dairy_products'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO subcategories (category_id, name) 
SELECT 
    pc.id,
    sub.name
FROM product_categories pc
CROSS JOIN (
    VALUES 
        ('لحم بقري'),
        ('لحم غنم'),
        ('دجاج'),
        ('سمك'),
        ('لحم مفروم'),
        ('نقانق'),
        ('لحم مجمد'),
        ('أخرى')
) AS sub(name)
WHERE pc.name = 'meat_poultry'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO subcategories (category_id, name) 
SELECT 
    pc.id,
    sub.name
FROM product_categories pc
CROSS JOIN (
    VALUES 
        ('مياه'),
        ('عصائر'),
        ('مشروبات غازية'),
        ('شاي'),
        ('قهوة'),
        ('حليب'),
        ('مشروبات طاقة'),
        ('أخرى')
) AS sub(name)
WHERE pc.name = 'beverages'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO subcategories (category_id, name) 
SELECT 
    pc.id,
    sub.name
FROM product_categories pc
CROSS JOIN (
    VALUES 
        ('منظفات'),
        ('صابون'),
        ('مناديل'),
        ('أدوات تنظيف'),
        ('مطهرات'),
        ('معطرات'),
        ('أخرى')
) AS sub(name)
WHERE pc.name = 'household'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO subcategories (category_id, name) 
SELECT 
    pc.id,
    sub.name
FROM product_categories pc
CROSS JOIN (
    VALUES 
        ('شامبو'),
        ('صابون'),
        ('معجون أسنان'),
        ('فرشاة أسنان'),
        ('كريمات'),
        ('عطور'),
        ('أخرى')
) AS sub(name)
WHERE pc.name = 'personal_care'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert sample news
INSERT INTO news (news_lable, description, image_url) VALUES
    ('افتتاح منصة ولكارد', 'تم افتتاح منصة ولكارد للتجارة بالجملة بنجاح', 'https://example.com/news1.jpg'),
    ('عروض خاصة للعملاء الجدد', 'احصل على خصم 10% على أول طلبية', 'https://example.com/news2.jpg'),
    ('تحديث التطبيق', 'تم إطلاق النسخة الجديدة من تطبيق ولكارد', 'https://example.com/news3.jpg')
ON CONFLICT (news_lable) DO NOTHING;

-- Create a sample admin user (you should change this in production)
-- Note: This creates a user with phone number that should be replaced with a real admin
INSERT INTO users (full_name, phone_number, user_type, is_approved) VALUES
    ('مدير النظام', '+964999999999', 'admin', true)
ON CONFLICT (phone_number) DO NOTHING;

-- Insert admin record for the sample admin
INSERT INTO admins (user_id, admin_level) 
SELECT id, 3 
FROM users 
WHERE phone_number = '+964999999999' AND user_type = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON reports(reported_user_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for basic access
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can insert their own data
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Merchants can read their own data
CREATE POLICY "Merchants can view own data" ON merchants
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Merchants can update their own data
CREATE POLICY "Merchants can update own data" ON merchants
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Merchants can insert their own data
CREATE POLICY "Merchants can insert own data" ON merchants
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Store owners can read their own data
CREATE POLICY "Store owners can view own data" ON store_owners
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Store owners can update their own data
CREATE POLICY "Store owners can update own data" ON store_owners
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Store owners can insert their own data
CREATE POLICY "Store owners can insert own data" ON store_owners
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Public can view active products
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (is_active = true);

-- Merchants can manage their own products
CREATE POLICY "Merchants can manage own products" ON products
    FOR ALL USING (auth.uid()::text = merchant_id::text);

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Public can view news
CREATE POLICY "Public can view news" ON news
    FOR SELECT USING (true);

-- Public can view product categories
CREATE POLICY "Public can view product categories" ON product_categories
    FOR SELECT USING (true);

-- Public can view subcategories
CREATE POLICY "Public can view subcategories" ON subcategories
    FOR SELECT USING (true);

-- Public can view units
CREATE POLICY "Public can view units" ON unit
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated; 