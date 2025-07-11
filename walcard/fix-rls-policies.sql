-- Fix RLS policies for Supabase Storage
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can access their own store images" ON storage.objects;
DROP POLICY IF EXISTS "Users can access their own identity images" ON storage.objects;
DROP POLICY IF EXISTS "Users can access their own business images" ON storage.objects;
DROP POLICY IF EXISTS "Users can access their own merchant store images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for store images" ON storage.objects;
DROP POLICY IF EXISTS "Admin access to all images" ON storage.objects;

-- 3. Create simplified policies for testing

-- Allow authenticated users to upload any image
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'forstore' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view their own images
CREATE POLICY "Allow authenticated view" ON storage.objects
FOR SELECT USING (
  bucket_id = 'forstore' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own images
CREATE POLICY "Allow authenticated update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'forstore' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'forstore' 
  AND auth.role() = 'authenticated'
);

-- 4. Create public read access for store images
CREATE POLICY "Public read access for store images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'forstore' 
  AND (
    storage.foldername(name)[1] = 'store-images'
    OR storage.foldername(name)[1] = 'merchant-store-images'
  )
);

-- 5. Create admin access policy
CREATE POLICY "Admin access to all images" ON storage.objects
FOR ALL USING (
  bucket_id = 'forstore' 
  AND auth.jwt() ->> 'role' = 'service_role'
);

-- 6. Verify the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forstore',
  'forstore',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

-- 7. Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'; 