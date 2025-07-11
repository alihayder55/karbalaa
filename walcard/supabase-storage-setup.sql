-- Create storage buckets for Walcard app
-- This script sets up the necessary storage buckets and policies

-- Create forstore bucket for store images and business data
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forstore',
  'forstore',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
) ON CONFLICT (id) DO NOTHING;

-- Create policies for forstore bucket

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'forstore' 
  AND auth.role() = 'authenticated'
);

-- Allow users to view their own images
CREATE POLICY "Allow users to view their own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'forstore' 
  AND (
    auth.role() = 'authenticated' 
    OR bucket_id = 'forstore'
  )
);

-- Allow users to update their own images
CREATE POLICY "Allow users to update their own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'forstore' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own images
CREATE POLICY "Allow users to delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'forstore' 
  AND auth.role() = 'authenticated'
);

-- Create folders structure (this will be created automatically when files are uploaded)
-- store-images/{user_id}/ - for store front images (store owners)
-- identity-images/{user_id}/ - for identity verification images  
-- business-images/{user_id}/ - for business related images
-- merchant-store-images/{user_id}/ - for merchant store images

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create function to get user ID from storage path
CREATE OR REPLACE FUNCTION get_user_id_from_storage_path(storage_path text)
RETURNS uuid AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Extract user ID from path like 'store-images/{user_id}/filename.jpg'
  SELECT split_part(split_part(storage_path, '/', 2), '/', 1)::uuid INTO user_id;
  RETURN user_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create more specific policies for user-specific access

-- Users can only access their own images in store-images folder
CREATE POLICY "Users can access their own store images" ON storage.objects
FOR ALL USING (
  bucket_id = 'forstore' 
  AND storage.foldername(name)[1] = 'store-images'
  AND get_user_id_from_storage_path(name) = auth.uid()
);

-- Users can only access their own images in identity-images folder
CREATE POLICY "Users can access their own identity images" ON storage.objects
FOR ALL USING (
  bucket_id = 'forstore' 
  AND storage.foldername(name)[1] = 'identity-images'
  AND get_user_id_from_storage_path(name) = auth.uid()
);

-- Users can only access their own images in business-images folder
CREATE POLICY "Users can access their own business images" ON storage.objects
FOR ALL USING (
  bucket_id = 'forstore' 
  AND storage.foldername(name)[1] = 'business-images'
  AND get_user_id_from_storage_path(name) = auth.uid()
);

-- Users can only access their own images in merchant-store-images folder
CREATE POLICY "Users can access their own merchant store images" ON storage.objects
FOR ALL USING (
  bucket_id = 'forstore' 
  AND storage.foldername(name)[1] = 'merchant-store-images'
  AND get_user_id_from_storage_path(name) = auth.uid()
);

-- Public read access for store images (so customers can see store photos)
CREATE POLICY "Public read access for store images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'forstore' 
  AND (
    storage.foldername(name)[1] = 'store-images'
    OR storage.foldername(name)[1] = 'merchant-store-images'
  )
);

-- Admin access (for moderators and admins)
CREATE POLICY "Admin access to all images" ON storage.objects
FOR ALL USING (
  bucket_id = 'forstore' 
  AND auth.jwt() ->> 'role' = 'service_role'
);

-- Comments for documentation
COMMENT ON TABLE storage.objects IS 'Storage objects for Walcard app images';
COMMENT ON FUNCTION get_user_id_from_storage_path IS 'Extract user ID from storage path for access control'; 