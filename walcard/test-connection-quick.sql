-- Quick test script for database connection
-- Run this in your Supabase SQL editor to test the new schema

-- Test 1: Check if users table exists and has correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Test 2: Check if merchants table exists and has correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'merchants' 
ORDER BY ordinal_position;

-- Test 3: Check if store_owners table exists and has correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_owners' 
ORDER BY ordinal_position;

-- Test 4: Check if all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 
    'merchants', 
    'store_owners', 
    'products', 
    'product_categories', 
    'subcategories', 
    'unit', 
    'orders', 
    'order_items', 
    'order_status_logs', 
    'user_auth_logs', 
    'reports', 
    'notifications', 
    'admins', 
    'news'
)
ORDER BY table_name;

-- Test 5: Check if indexes exist
SELECT 
    indexname, 
    tablename, 
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'merchants', 'store_owners')
ORDER BY tablename, indexname;

-- Test 6: Check if RLS policies exist
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
WHERE schemaname = 'public' 
AND tablename IN ('users', 'merchants', 'store_owners')
ORDER BY tablename, policyname;

-- Test 7: Check if default data exists
SELECT 'product_categories' as table_name, COUNT(*) as count FROM product_categories
UNION ALL
SELECT 'unit' as table_name, COUNT(*) as count FROM unit
UNION ALL
SELECT 'subcategories' as table_name, COUNT(*) as count FROM subcategories
UNION ALL
SELECT 'news' as table_name, COUNT(*) as count FROM news;

-- Test 8: Test basic insert operation (this will be rolled back)
BEGIN;
-- Try to insert a test user
INSERT INTO users (full_name, phone_number, user_type) 
VALUES ('Test User', '+964123456789', 'merchant');

-- Check if insert was successful
SELECT * FROM users WHERE phone_number = '+964123456789';

-- Rollback to avoid leaving test data
ROLLBACK;

-- Test 9: Check if functions exist
SELECT 
    routine_name, 
    routine_type, 
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_account_info', 'get_business_types', 'get_working_days', 'get_cities')
ORDER BY routine_name;

-- Test 10: Check if triggers exist
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('users', 'merchants', 'store_owners')
ORDER BY event_object_table, trigger_name; 