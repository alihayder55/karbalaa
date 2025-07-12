-- Check current database schema and structure
-- Run this in Supabase SQL Editor to see what tables and columns actually exist

-- 1. Check if product_categories table exists and what columns it has
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_categories' 
ORDER BY ordinal_position;

-- 2. Check if products table exists and what columns it has
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 3. Check if user_favorites table exists
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_favorites' 
ORDER BY ordinal_position;

-- 4. Check if orders table exists and what columns it has
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 5. List all existing tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 6. Check if the favorites functions exist
SELECT 
    routine_name, 
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%favorite%';

-- 7. Show sample data from product_categories if it exists
SELECT * FROM product_categories LIMIT 5;

-- 8. Show sample data from products if it exists
SELECT id, name, price, category_id FROM products LIMIT 5; 