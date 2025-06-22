# Supabase Setup for Your Project

## 🎯 **Your Supabase Project**
# Supabase Setup for Your Project

## 🎯 **Your Supabase Project**
- **URL**: `https://udbkvdqkksawteyytnih.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkYmt2ZHFra3Nhd3RleXl0bmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NDExODMsImV4cCI6MjA2NjExNzE4M30.yTFVKKYuVCqAMMd4oBz2ZRV6p9mpmJhu9QLshVQbocI`

## ✅ **Step 1: Enable Phone Authentication**

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/udbkvdqkksawteyytnih
2. **Navigate to**: Authentication > Settings
3. **Enable Phone Auth**:
   - ✅ Check "Enable phone confirmations"
   - ✅ Check "Enable phone signup"

## ✅ **Step 2: Set Up SMS Provider**

1. **In Authentication > Settings**
2. **SMS Provider**: Select "Twilio"
3. **Enter Twilio Credentials**:
   - **Account SID**: `AC...` (from your Twilio console)
   - **Auth Token**: `...` (from your Twilio console)
   - **Message Service ID**: `MG...` (WhatsApp service ID)

## ✅ **Step 3: Create Database Tables**

1. **Go to**: SQL Editor in your Supabase dashboard
2. **Run this SQL**:

```sql
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
```

## ✅ **Step 4: Test the Connection**

1. **Start your app**: `npm start`
2. **Check console logs** for:
   - `✅ Supabase connection test successful`
   - `✅ Supabase auth test successful`
   - `✅ Phone auth test successful`

## 🔧 **Twilio Setup (Optional)**

If you want to use WhatsApp instead of SMS:

1. **Create Twilio Account**: https://twilio.com
2. **Get Credentials**:
   - Account SID (starts with AC)
   - Auth Token
   - WhatsApp Service ID (starts with MG)
3. **Update Supabase** with these credentials

## 🧪 **Testing Your Setup**

### **Test Registration**:
1. Enter a valid phone number (international format: +964...)
2. Click "إنشاء الحساب عبر SMS"
3. Check your phone for SMS
4. Enter the 6-digit code
5. Should create user profile in database

### **Test Login**:
1. Enter the same phone number
2. Click "متابعة عبر SMS"
3. Enter the 6-digit code
4. Should log in successfully

## 📊 **Monitor Your App**

### **Check Supabase Logs**:
1. Go to your Supabase Dashboard
2. Navigate to Logs
3. Look for authentication events

### **Check Database**:
1. Go to Table Editor
2. Check the `profiles` table
3. Should see user records after registration

## 🎉 **Your App is Ready!**

After completing these steps:
- ✅ Phone authentication will work
- ✅ User profiles will be created
- ✅ Database will store user data
- ✅ App will function fully

---

**Need help? Check the console logs for detailed error messages!** 