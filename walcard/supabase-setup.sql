-- Create profiles table for user registration
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

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

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function for updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create merchants table
CREATE TABLE IF NOT EXISTS public.merchants (
    id SERIAL NOT NULL,
    full_name TEXT NOT NULL,
    business_name TEXT NOT NULL,
    chamber_of_commerce_id CHARACTER VARYING(50) NULL,
    phone CHARACTER VARYING(20) NOT NULL,
    available_products TEXT[] NULL,
    is_approved BOOLEAN NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    CONSTRAINT merchants_pkey PRIMARY KEY (id),
    CONSTRAINT merchants_available_products_check CHECK ((array_length(available_products, 1) > 0))
);

-- Create indexes for merchants table
CREATE INDEX IF NOT EXISTS idx_merchants_is_approved ON public.merchants USING btree (is_approved);
CREATE INDEX IF NOT EXISTS idx_merchants_phone ON public.merchants USING btree (phone);

-- Enable RLS for merchants
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- Create policies for merchants
CREATE POLICY "Merchants can view their own data" ON public.merchants
    FOR SELECT USING (phone = (SELECT phone_number FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Merchants can insert their own data" ON public.merchants
    FOR INSERT WITH CHECK (phone = (SELECT phone_number FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Merchants can update their own data" ON public.merchants
    FOR UPDATE USING (phone = (SELECT phone_number FROM public.profiles WHERE id = auth.uid()));

-- Create trigger for merchants updated_at
DROP TRIGGER IF EXISTS update_merchants_updated_at ON public.merchants;
CREATE TRIGGER update_merchants_updated_at 
    BEFORE UPDATE ON public.merchants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create store_owners table
CREATE TABLE IF NOT EXISTS public.store_owners (
    id SERIAL NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    nearest_landmark TEXT NULL,
    latitude NUMERIC(9, 6) NULL,
    longitude NUMERIC(9, 6) NULL,
    phone CHARACTER VARYING(20) NOT NULL,
    store_type CHARACTER VARYING(50) NOT NULL,
    storefront_image TEXT NULL,
    is_approved BOOLEAN NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    CONSTRAINT store_owners_pkey PRIMARY KEY (id)
);

-- Create indexes for store_owners table
CREATE INDEX IF NOT EXISTS idx_store_owners_is_approved ON public.store_owners USING btree (is_approved);
CREATE INDEX IF NOT EXISTS idx_store_owners_phone ON public.store_owners USING btree (phone);

-- Enable RLS for store_owners
ALTER TABLE public.store_owners ENABLE ROW LEVEL SECURITY;

-- Create policies for store_owners
CREATE POLICY "Store owners can view their own data" ON public.store_owners
    FOR SELECT USING (phone = (SELECT phone_number FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Store owners can insert their own data" ON public.store_owners
    FOR INSERT WITH CHECK (phone = (SELECT phone_number FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Store owners can update their own data" ON public.store_owners
    FOR UPDATE USING (phone = (SELECT phone_number FROM public.profiles WHERE id = auth.uid()));

-- Create trigger for store_owners updated_at
DROP TRIGGER IF EXISTS update_store_owners_updated_at ON public.store_owners;
CREATE TRIGGER update_store_owners_updated_at 
    BEFORE UPDATE ON public.store_owners 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 