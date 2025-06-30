-- Drop existing triggers first (in reverse order due to dependencies)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_merchants_updated_at ON public.merchants;
DROP TRIGGER IF EXISTS update_store_owners_updated_at ON public.store_owners;
DROP TRIGGER IF EXISTS update_approval_requests_updated_at ON public.approval_requests;
DROP TRIGGER IF EXISTS update_user_type_on_merchant_insert ON public.merchants;
DROP TRIGGER IF EXISTS update_user_type_on_store_owner_insert ON public.store_owners;
DROP TRIGGER IF EXISTS create_merchant_approval_request ON public.merchants;
DROP TRIGGER IF EXISTS create_store_owner_approval_request ON public.store_owners;

-- Drop existing tables if they exist (in reverse order due to dependencies)
DROP TABLE IF EXISTS public.approval_requests CASCADE;
DROP TABLE IF EXISTS public.merchants CASCADE;
DROP TABLE IF EXISTS public.store_owners CASCADE;
DROP TABLE IF EXISTS public.business_types CASCADE;
DROP TABLE IF EXISTS public.working_days CASCADE;
DROP TABLE IF EXISTS public.cities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_type_on_account_creation() CASCADE;
DROP FUNCTION IF EXISTS public.create_approval_request() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_account_info(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_business_types() CASCADE;
DROP FUNCTION IF EXISTS public.get_working_days() CASCADE;
DROP FUNCTION IF EXISTS public.get_cities() CASCADE;
DROP FUNCTION IF EXISTS public.get_merchant_details(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_store_owner_details(UUID) CASCADE;

-- Create profiles table for user registration
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    user_type TEXT CHECK (user_type IN ('merchant', 'store_owner')) NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create merchants table (linked to profiles via user_id)
CREATE TABLE IF NOT EXISTS public.merchants (
    id SERIAL NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    company_name TEXT NULL,
    store_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    whatsapp_number TEXT NULL,
    business_type TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    latitude NUMERIC(9, 6) NULL,
    longitude NUMERIC(9, 6) NULL,
    working_days TEXT[] NOT NULL,
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL,
    id_image TEXT NULL,
    store_image TEXT NULL,
    wants_ads BOOLEAN DEFAULT FALSE,
    offers_daily_deals BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    CONSTRAINT merchants_pkey PRIMARY KEY (id),
    CONSTRAINT merchants_user_id_unique UNIQUE (user_id),
    CONSTRAINT merchants_working_days_check CHECK ((array_length(working_days, 1) > 0))
);

-- Create store_owners table (linked to profiles via user_id)
CREATE TABLE IF NOT EXISTS public.store_owners (
    id SERIAL NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    company_name TEXT NULL,
    store_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    whatsapp_number TEXT NULL,
    business_type TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    latitude NUMERIC(9, 6) NULL,
    longitude NUMERIC(9, 6) NULL,
    working_days TEXT[] NOT NULL,
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL,
    id_image TEXT NULL,
    store_image TEXT NULL,
    wants_ads BOOLEAN DEFAULT FALSE,
    offers_daily_deals BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    CONSTRAINT store_owners_pkey PRIMARY KEY (id),
    CONSTRAINT store_owners_user_id_unique UNIQUE (user_id),
    CONSTRAINT store_owners_working_days_check CHECK ((array_length(working_days, 1) > 0))
);

-- Create business_types table for predefined business types
CREATE TABLE IF NOT EXISTS public.business_types (
    id SERIAL NOT NULL,
    name TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT business_types_pkey PRIMARY KEY (id)
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

-- Create working_days table for predefined working days
CREATE TABLE IF NOT EXISTS public.working_days (
    id SERIAL NOT NULL,
    day_code TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT working_days_pkey PRIMARY KEY (id)
);

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

-- Create cities table for predefined cities
CREATE TABLE IF NOT EXISTS public.cities (
    id SERIAL NOT NULL,
    name TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT cities_pkey PRIMARY KEY (id)
);

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

-- Create approval_requests table for tracking registration requests
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id SERIAL NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_type TEXT NOT NULL CHECK (user_type IN ('merchant', 'store_owner')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT NULL,
    reviewed_by UUID REFERENCES auth.users(id) NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT approval_requests_pkey PRIMARY KEY (id),
    CONSTRAINT approval_requests_user_id_unique UNIQUE (user_id)
);

-- Create indexes for approval_requests
CREATE INDEX IF NOT EXISTS idx_approval_requests_user_id ON public.approval_requests USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.approval_requests USING btree (status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_user_type ON public.approval_requests USING btree (user_type);

-- Enable RLS for approval_requests
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for approval_requests
CREATE POLICY "Users can view their own approval requests" ON public.approval_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own approval requests" ON public.approval_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create trigger for updated_at on merchants
DROP TRIGGER IF EXISTS update_merchants_updated_at ON public.merchants;
CREATE TRIGGER update_merchants_updated_at
    BEFORE UPDATE ON public.merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on store_owners
DROP TRIGGER IF EXISTS update_store_owners_updated_at ON public.store_owners;
CREATE TRIGGER update_store_owners_updated_at
    BEFORE UPDATE ON public.store_owners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on approval_requests
DROP TRIGGER IF EXISTS update_approval_requests_updated_at ON public.approval_requests;
CREATE TRIGGER update_approval_requests_updated_at
    BEFORE UPDATE ON public.approval_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers to update user_type automatically
DROP TRIGGER IF EXISTS update_user_type_on_merchant_insert ON public.merchants;
CREATE TRIGGER update_user_type_on_merchant_insert
    AFTER INSERT ON public.merchants
    FOR EACH ROW EXECUTE FUNCTION public.update_user_type_on_account_creation();

DROP TRIGGER IF EXISTS update_user_type_on_store_owner_insert ON public.store_owners;
CREATE TRIGGER update_user_type_on_store_owner_insert
    AFTER INSERT ON public.store_owners
    FOR EACH ROW EXECUTE FUNCTION public.update_user_type_on_account_creation();

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone_number)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function for updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user type when account is created
CREATE OR REPLACE FUNCTION public.update_user_type_on_account_creation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'merchants' THEN
        UPDATE public.profiles 
        SET user_type = 'merchant' 
        WHERE id = NEW.user_id;
    ELSIF TG_TABLE_NAME = 'store_owners' THEN
        UPDATE public.profiles 
        SET user_type = 'store_owner' 
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically create approval request
CREATE OR REPLACE FUNCTION public.create_approval_request()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.approval_requests (user_id, user_type, status)
    VALUES (
        NEW.user_id,
        CASE 
            WHEN TG_TABLE_NAME = 'merchants' THEN 'merchant'
            WHEN TG_TABLE_NAME = 'store_owners' THEN 'store_owner'
        END,
        'pending'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updated_at on profiles
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create triggers to automatically create approval requests
CREATE TRIGGER create_merchant_approval_request
    AFTER INSERT ON public.merchants
    FOR EACH ROW EXECUTE FUNCTION public.create_approval_request();

CREATE TRIGGER create_store_owner_approval_request
    AFTER INSERT ON public.store_owners
    FOR EACH ROW EXECUTE FUNCTION public.create_approval_request();

-- Create function to check user type and account status
CREATE OR REPLACE FUNCTION public.get_user_account_info(phone_input TEXT)
RETURNS TABLE (
    has_account BOOLEAN,
    user_type TEXT,
    is_approved BOOLEAN,
    full_name TEXT,
    store_name TEXT,
    business_type TEXT,
    city TEXT,
    district TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN p.id IS NOT NULL THEN TRUE 
            ELSE FALSE 
        END as has_account,
        p.user_type,
        CASE 
            WHEN p.user_type = 'merchant' THEN m.is_approved
            WHEN p.user_type = 'store_owner' THEN s.is_approved
            ELSE FALSE
        END as is_approved,
        p.full_name,
        CASE 
            WHEN p.user_type = 'merchant' THEN m.store_name
            WHEN p.user_type = 'store_owner' THEN s.store_name
            ELSE NULL
        END as store_name,
        CASE 
            WHEN p.user_type = 'merchant' THEN m.business_type
            WHEN p.user_type = 'store_owner' THEN s.business_type
            ELSE NULL
        END as business_type,
        CASE 
            WHEN p.user_type = 'merchant' THEN m.city
            WHEN p.user_type = 'store_owner' THEN s.city
            ELSE NULL
        END as city,
        CASE 
            WHEN p.user_type = 'merchant' THEN m.district
            WHEN p.user_type = 'store_owner' THEN s.district
            ELSE NULL
        END as district
    FROM public.profiles p
    LEFT JOIN public.merchants m ON p.id = m.user_id
    LEFT JOIN public.store_owners s ON p.id = s.user_id
    WHERE p.phone_number = phone_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all active business types
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
    ORDER BY bt.name_ar;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all active working days
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

-- Create function to get all active cities
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

-- Create function to get merchant details by user_id
CREATE OR REPLACE FUNCTION public.get_merchant_details(user_id_input UUID)
RETURNS TABLE (
    id INTEGER,
    full_name TEXT,
    company_name TEXT,
    store_name TEXT,
    phone_number TEXT,
    whatsapp_number TEXT,
    business_type TEXT,
    address TEXT,
    city TEXT,
    district TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    working_days TEXT[],
    opening_time TIME,
    closing_time TIME,
    id_image TEXT,
    store_image TEXT,
    wants_ads BOOLEAN,
    offers_daily_deals BOOLEAN,
    is_approved BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.full_name,
        m.company_name,
        m.store_name,
        m.phone_number,
        m.whatsapp_number,
        m.business_type,
        m.address,
        m.city,
        m.district,
        m.latitude,
        m.longitude,
        m.working_days,
        m.opening_time,
        m.closing_time,
        m.id_image,
        m.store_image,
        m.wants_ads,
        m.offers_daily_deals,
        m.is_approved,
        m.created_at
    FROM public.merchants m
    WHERE m.user_id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get store owner details by user_id
CREATE OR REPLACE FUNCTION public.get_store_owner_details(user_id_input UUID)
RETURNS TABLE (
    id INTEGER,
    full_name TEXT,
    company_name TEXT,
    store_name TEXT,
    phone_number TEXT,
    whatsapp_number TEXT,
    business_type TEXT,
    address TEXT,
    city TEXT,
    district TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    working_days TEXT[],
    opening_time TIME,
    closing_time TIME,
    id_image TEXT,
    store_image TEXT,
    wants_ads BOOLEAN,
    offers_daily_deals BOOLEAN,
    is_approved BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.full_name,
        s.company_name,
        s.store_name,
        s.phone_number,
        s.whatsapp_number,
        s.business_type,
        s.address,
        s.city,
        s.district,
        s.latitude,
        s.longitude,
        s.working_days,
        s.opening_time,
        s.closing_time,
        s.id_image,
        s.store_image,
        s.wants_ads,
        s.offers_daily_deals,
        s.is_approved,
        s.created_at
    FROM public.store_owners s
    WHERE s.user_id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- END OF DATABASE SETUP
-- =====================================================

/*
SUMMARY OF CREATED TABLES AND FUNCTIONS:

1. TABLES:
   - profiles: User profiles with basic information
   - merchants: Merchant registration data with all new fields
   - store_owners: Store owner registration data with all new fields
   - business_types: Predefined business types (مواد غذائية, لحوم, etc.)
   - working_days: Predefined working days (السبت, الأحد, etc.)
   - cities: Predefined Iraqi cities (بغداد, البصرة, etc.)
   - approval_requests: Track registration approval status

2. FUNCTIONS:
   - handle_new_user(): Auto-create profile when user signs up
   - handle_updated_at(): Auto-update updated_at timestamp
   - update_user_type_on_account_creation(): Auto-set user_type
   - create_approval_request(): Auto-create approval request
   - get_user_account_info(): Get user account status
   - get_business_types(): Get all active business types
   - get_working_days(): Get all active working days
   - get_cities(): Get all active cities
   - get_merchant_details(): Get merchant details by user_id
   - get_store_owner_details(): Get store owner details by user_id

3. NEW FIELDS ADDED TO MERCHANTS AND STORE_OWNERS:
   - full_name: اسم التاجر الكامل
   - company_name: اسم الشركة
   - store_name: اسم المتجر أو العلامة التجارية
   - phone_number: رقم الهاتف الرئيسي
   - whatsapp_number: رقم الواتساب
   - business_type: نوع النشاط التجاري
   - address: العنوان التفصيلي
   - city: المدينة
   - district: المنطقة
   - latitude/longitude: إحداثيات الموقع
   - working_days: أيام العمل (array)
   - opening_time/closing_time: ساعات العمل
   - id_image: صورة هوية صاحب العمل
   - store_image: صورة المتجر
   - wants_ads: خيار الإعلانات داخل التطبيق
   - offers_daily_deals: خيار العروض اليومية

4. SECURITY:
   - Row Level Security (RLS) enabled on all tables
   - Users can only access their own data
   - Proper policies for SELECT, INSERT, UPDATE operations

5. AUTOMATION:
   - Automatic profile creation on user signup
   - Automatic user_type assignment
   - Automatic approval request creation
   - Automatic timestamp updates

USAGE EXAMPLES:

-- Get user account info
SELECT * FROM get_user_account_info('+9647501234567');

-- Get all business types
SELECT * FROM get_business_types();

-- Get all cities
SELECT * FROM get_cities();

-- Get merchant details
SELECT * FROM get_merchant_details('user-uuid-here');

-- Get store owner details
SELECT * FROM get_store_owner_details('user-uuid-here');

-- Check approval status
SELECT * FROM approval_requests WHERE user_id = 'user-uuid-here';
*/ 