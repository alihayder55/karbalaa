-- Check Storage Setup
-- Run this to verify everything is working

-- 1. Check if bucket exists
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'forstore';

-- 2. Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 3. List all policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- 4. Check current user (if authenticated)
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 5. Test folder creation (this will create test folders)
-- Note: This is just for testing, you can delete these later
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
VALUES 
  ('forstore', 'store-images/test-user/test.txt', auth.uid(), '{"mimetype": "text/plain"}'),
  ('forstore', 'identity-images/test-user/test.txt', auth.uid(), '{"mimetype": "text/plain"}'),
  ('forstore', 'business-images/test-user/test.txt', auth.uid(), '{"mimetype": "text/plain"}'),
  ('forstore', 'merchant-store-images/test-user/test.txt', auth.uid(), '{"mimetype": "text/plain"}')
ON CONFLICT DO NOTHING;

-- 6. List created objects
SELECT 
  name,
  bucket_id,
  owner,
  created_at
FROM storage.objects 
WHERE bucket_id = 'forstore'
ORDER BY created_at DESC; 