-- TEMPORARY: Disable RLS for testing
-- WARNING: This is NOT recommended for production
-- Only use this for testing, then re-enable RLS

-- 1. Disable RLS temporarily
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. Check if it's disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 3. Test upload (this should work now)
-- You can test your app now

-- 4. When testing is done, re-enable RLS and run the proper policies
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- Then run the fix-rls-policies.sql script 