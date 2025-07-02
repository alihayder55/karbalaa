-- Database Migration Script for Walcard App
-- This script updates the existing database to be compatible with the current app

-- Step 1: Backup existing data (if needed)
-- CREATE TABLE profiles_backup AS SELECT * FROM profiles;
-- CREATE TABLE merchants_backup AS SELECT * FROM merchants;
-- CREATE TABLE store_owners_backup AS SELECT * FROM store_owners;

-- Step 2: Add missing columns to existing tables

-- Update merchants table to include all required fields
ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS nearest_landmark TEXT,
ADD COLUMN IF NOT EXISTS chamber_of_commerce_id TEXT,
ADD COLUMN IF NOT EXISTS wants_ads BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS offers_daily_deals BOOLEAN DEFAULT FALSE;

-- Update store_owners table to include all required fields
ALTER TABLE public.store_owners 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS store_type TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS nearest_landmark TEXT,
ADD COLUMN IF NOT EXISTS wants_ads BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS offers_daily_deals BOOLEAN DEFAULT FALSE;

-- Step 3: Rename profiles table to users and update structure
-- First, create the new users table
CREATE TABLE IF NOT EXISTS public.users_new (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    user_type TEXT CHECK (user_type IN ('merchant', 'store_owner', 'admin')) NOT NULL,
    avatar_url TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy data from profiles to users_new
INSERT INTO public.users_new (id, full_name, phone_number, user_type, avatar_url, is_approved, created_at, updated_at)
SELECT id, full_name, phone_number, user_type, avatar_url, 
       COALESCE((SELECT is_approved FROM merchants WHERE user_id = profiles.id), 
                (SELECT is_approved FROM store_owners WHERE user_id = profiles.id), 
                FALSE) as is_approved,
       created_at, updated_at
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- Step 4: Update foreign key references
-- Update merchants table to reference users_new
ALTER TABLE public.merchants 
DROP CONSTRAINT IF EXISTS merchants_user_id_fkey;

ALTER TABLE public.merchants 
ADD CONSTRAINT merchants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users_new(id) ON DELETE CASCADE;

-- Update store_owners table to reference users_new
ALTER TABLE public.store_owners 
DROP CONSTRAINT IF EXISTS store_owners_user_id_fkey;

ALTER TABLE public.store_owners 
ADD CONSTRAINT store_owners_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users_new(id) ON DELETE CASCADE;

-- Step 5: Drop old profiles table and rename users_new
DROP TABLE IF EXISTS public.profiles CASCADE;
ALTER TABLE public.users_new RENAME TO users;

-- Step 6: Add missing constraints and indexes
-- Add constraints for working days
ALTER TABLE public.merchants 
ADD CONSTRAINT IF NOT EXISTS merchants_working_days_check 
CHECK ((array_length(working_days, 1) > 0));

ALTER TABLE public.store_owners 
ADD CONSTRAINT IF NOT EXISTS store_owners_working_days_check 
CHECK ((array_length(working_days, 1) > 0));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_approved ON public.users(is_approved);
CREATE INDEX IF NOT EXISTS idx_merchants_city ON public.merchants(city);
CREATE INDEX IF NOT EXISTS idx_merchants_business_type ON public.merchants(business_type);
CREATE INDEX IF NOT EXISTS idx_store_owners_city ON public.store_owners(city);
CREATE INDEX IF NOT EXISTS idx_store_owners_store_type ON public.store_owners(store_type);

-- Step 7: Update the get_user_account_info function
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

-- Step 8: Update triggers
-- Drop old triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;

-- Create new trigger for users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, phone_number, user_type)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.phone, 'merchant');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Step 9: Update RLS policies
-- Drop old policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Step 10: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Step 11: Verify migration
-- Check if all required columns exist
DO $$
BEGIN
    -- Check merchants table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'merchants' AND column_name = 'business_name'
    ) THEN
        RAISE EXCEPTION 'Migration failed: business_name column not found in merchants table';
    END IF;
    
    -- Check store_owners table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_owners' AND column_name = 'store_type'
    ) THEN
        RAISE EXCEPTION 'Migration failed: store_type column not found in store_owners table';
    END IF;
    
    -- Check users table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users'
    ) THEN
        RAISE EXCEPTION 'Migration failed: users table not found';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$; 