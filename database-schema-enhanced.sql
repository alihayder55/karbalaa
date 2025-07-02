-- Enhanced Database Schema for Walcard App
-- Compatible with current app structure and includes all required fields

-- Drop existing tables and functions (in reverse order due to dependencies)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_merchants_updated_at ON public.merchants;
DROP TRIGGER IF EXISTS update_store_owners_updated_at ON public.store_owners;
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;

DROP TABLE IF EXISTS public.order_status_logs CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.subcategories CASCADE;
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.user_auth_logs CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.merchants CASCADE;
DROP TABLE IF EXISTS public.store_owners CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.news CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_account_info(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_business_types() CASCADE;
DROP FUNCTION IF EXISTS public.get_working_days() CASCADE;
DROP FUNCTION IF EXISTS public.get_cities() CASCADE;

-- Create main users table (replaces profiles)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    user_type TEXT CHECK (user_type IN ('merchant', 'store_owner', 'admin')) NOT NULL,
    avatar_url TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create merchants table with all required fields
CREATE TABLE IF NOT EXISTS public.merchants (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    business_name TEXT NOT NULL,
    company_name TEXT,
    store_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    whatsapp_number TEXT,
    business_type TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    nearest_landmark TEXT NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    working_days TEXT[] NOT NULL,
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL,
    identity_image TEXT,
    store_image TEXT,
    chamber_of_commerce_id TEXT,
    wants_ads BOOLEAN DEFAULT FALSE,
    offers_daily_deals BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT merchants_working_days_check CHECK ((array_length(working_days, 1) > 0))
);

-- Create store_owners table with all required fields
CREATE TABLE IF NOT EXISTS public.store_owners (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    company_name TEXT,
    store_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    whatsapp_number TEXT,
    store_type TEXT NOT NULL,
    business_type TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    nearest_landmark TEXT NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    working_days TEXT[] NOT NULL,
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL,
    storefront_image TEXT,
    wants_ads BOOLEAN DEFAULT FALSE,
    offers_daily_deals BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT store_owners_working_days_check CHECK ((array_length(working_days, 1) > 0))
);

-- Create product_categories table
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES public.merchants(user_id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.product_categories(id),
    subcategory_id UUID REFERENCES public.subcategories(id),
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    price NUMERIC(12, 2) NOT NULL,
    discount_price NUMERIC(12, 2),
    image_url TEXT,
    available_quantity INT DEFAULT 0,
    unit TEXT DEFAULT 'unit',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    store_owner_id UUID REFERENCES public.store_owners(user_id),
    merchant_id UUID REFERENCES public.merchants(user_id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
    total_price NUMERIC(12, 2) NOT NULL,
    delivery_address TEXT,
    delivery_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    quantity INT NOT NULL,
    price_at_order NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_status_logs table
CREATE TABLE IF NOT EXISTS public.order_status_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES public.users(id),
    notes TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_auth_logs table
CREATE TABLE IF NOT EXISTS public.user_auth_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_used BOOLEAN DEFAULT FALSE
);

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    report_type TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    title_ar TEXT,
    message TEXT NOT NULL,
    message_ar TEXT,
    notification_type TEXT DEFAULT 'general' CHECK (notification_type IN ('order', 'system', 'promotion', 'general')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    admin_level INT NOT NULL CHECK (admin_level BETWEEN 1 AND 3),
    permissions TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create news table
CREATE TABLE IF NOT EXISTS public.news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    news_label TEXT NOT NULL,
    news_label_ar TEXT,
    description TEXT,
    description_ar TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create business_types table for predefined business types
CREATE TABLE IF NOT EXISTS public.business_types (
    id SERIAL NOT NULL,
    name TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT business_types_pkey PRIMARY KEY (id)
);

-- Create working_days table for predefined working days
CREATE TABLE IF NOT EXISTS public.working_days (
    id SERIAL NOT NULL,
    day_code TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT working_days_pkey PRIMARY KEY (id)
);

-- Create cities table for predefined cities
CREATE TABLE IF NOT EXISTS public.cities (
    id SERIAL NOT NULL,
    name TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT cities_pkey PRIMARY KEY (id)
);

-- Insert default business types
INSERT INTO public.business_types (name, name_ar) VALUES
    ('food', 'مواد غذائية'),
    ('meat', 'لحوم'),
    ('dairy', 'ألبان'),
    ('cleaning', 'منظفات'),
    ('vegetables', 'خضروات وفواكه'),
    ('bakery', 'مخبز'),
    ('restaurant', 'مطعم'),
    ('cafe', 'كافيه'),
    ('supermarket', 'سوبر ماركت'),
    ('hypermarket', 'هايبر ماركت'),
    ('pharmacy', 'صيدلية'),
    ('other', 'أخرى')
ON CONFLICT (name) DO NOTHING;

-- Insert default working days
INSERT INTO public.working_days (day_code, name_en, name_ar) VALUES
    ('saturday', 'Saturday', 'السبت'),
    ('sunday', 'Sunday', 'الأحد'),
    ('monday', 'Monday', 'الاثنين'),
    ('tuesday', 'Tuesday', 'الثلاثاء'),
    ('wednesday', 'Wednesday', 'الأربعاء'),
    ('thursday', 'Thursday', 'الخميس'),
    ('friday', 'Friday', 'الجمعة')
ON CONFLICT (day_code) DO NOTHING;

-- Insert default cities (Iraq)
INSERT INTO public.cities (name, name_ar) VALUES
    ('baghdad', 'بغداد'),
    ('basra', 'البصرة'),
    ('mosul', 'الموصل'),
    ('erbil', 'أربيل'),
    ('sulaymaniyah', 'السليمانية'),
    ('karbala', 'كربلاء'),
    ('najaf', 'النجف'),
    ('kirkuk', 'كركوك'),
    ('diyala', 'ديالى'),
    ('wasit', 'واسط'),
    ('qadisiyah', 'القادسية'),
    ('babil', 'بابل'),
    ('anbar', 'الأنبار'),
    ('nineveh', 'نينوى'),
    ('dhi_qar', 'ذي قار'),
    ('maysan', 'ميسان'),
    ('dohuk', 'دهوك'),
    ('halabja', 'حلبجة')
ON CONFLICT (name) DO NOTHING;

-- Insert default product categories
INSERT INTO public.product_categories (name, name_ar, description) VALUES
    ('groceries', 'مواد غذائية', 'All types of grocery items'),
    ('fresh_produce', 'خضروات وفواكه طازجة', 'Fresh vegetables and fruits'),
    ('dairy_products', 'منتجات الألبان', 'Dairy and milk products'),
    ('meat_poultry', 'لحوم ودواجن', 'Meat and poultry products'),
    ('beverages', 'مشروبات', 'Beverages and drinks'),
    ('household', 'منتجات منزلية', 'Household and cleaning products'),
    ('personal_care', 'العناية الشخصية', 'Personal care and hygiene products'),
    ('electronics', 'إلكترونيات', 'Electronic devices and accessories')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_approved ON public.users(is_approved);
CREATE INDEX IF NOT EXISTS idx_merchants_city ON public.merchants(city);
CREATE INDEX IF NOT EXISTS idx_merchants_business_type ON public.merchants(business_type);
CREATE INDEX IF NOT EXISTS idx_store_owners_city ON public.store_owners(city);
CREATE INDEX IF NOT EXISTS idx_store_owners_store_type ON public.store_owners(store_type);
CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON public.products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, phone_number, user_type)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.phone, 'merchant');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enhanced function to get user account info
CREATE OR REPLACE FUNCTION public.get_user_account_info(phone_input TEXT)
RETURNS TABLE (
    has_account BOOLEAN,
    user_type TEXT,
    is_approved BOOLEAN,
    full_name TEXT,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TRUE as has_account,
        u.user_type,
        u.is_approved,
        u.full_name,
        u.id as user_id
    FROM public.users u
    WHERE u.phone_number = phone_input;
    
    -- If no user found, return false
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, FALSE, NULL::TEXT, NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get business types
CREATE OR REPLACE FUNCTION public.get_business_types()
RETURNS TABLE (
    id INTEGER,
    name TEXT,
    name_ar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT bt.id, bt.name, bt.name_ar
    FROM public.business_types bt
    WHERE bt.is_active = TRUE
    ORDER BY bt.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get working days
CREATE OR REPLACE FUNCTION public.get_working_days()
RETURNS TABLE (
    id INTEGER,
    day_code TEXT,
    name_en TEXT,
    name_ar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT wd.id, wd.day_code, wd.name_en, wd.name_ar
    FROM public.working_days wd
    WHERE wd.is_active = TRUE
    ORDER BY wd.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cities
CREATE OR REPLACE FUNCTION public.get_cities()
RETURNS TABLE (
    id INTEGER,
    name TEXT,
    name_ar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.name_ar
    FROM public.cities c
    WHERE c.is_active = TRUE
    ORDER BY c.name_ar;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_merchants_updated_at
    BEFORE UPDATE ON public.merchants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_owners_updated_at
    BEFORE UPDATE ON public.store_owners
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Merchants can read their own data
CREATE POLICY "Merchants can view own data" ON public.merchants
    FOR SELECT USING (auth.uid() = user_id);

-- Merchants can update their own data
CREATE POLICY "Merchants can update own data" ON public.merchants
    FOR UPDATE USING (auth.uid() = user_id);

-- Store owners can read their own data
CREATE POLICY "Store owners can view own data" ON public.store_owners
    FOR SELECT USING (auth.uid() = user_id);

-- Store owners can update their own data
CREATE POLICY "Store owners can update own data" ON public.store_owners
    FOR UPDATE USING (auth.uid() = user_id);

-- Public can view approved merchants and store owners
CREATE POLICY "Public can view approved merchants" ON public.merchants
    FOR SELECT USING (is_approved = TRUE);

CREATE POLICY "Public can view approved store owners" ON public.store_owners
    FOR SELECT USING (is_approved = TRUE);

-- Public can view active products
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (is_active = TRUE);

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated; 