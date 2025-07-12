-- Inventory Management System Setup Script
-- Run this script in Supabase SQL Editor to ensure all required columns exist

-- 1. Ensure products table has available_quantity column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'available_quantity'
    ) THEN
        ALTER TABLE products ADD COLUMN available_quantity INTEGER DEFAULT 0;
        RAISE NOTICE 'Added available_quantity column to products table';
    ELSE
        RAISE NOTICE 'available_quantity column already exists in products table';
    END IF;
END $$;

-- 2. Update existing products with default quantities if they are NULL or 0
UPDATE products 
SET available_quantity = 50 
WHERE available_quantity IS NULL OR available_quantity = 0;

-- 3. Ensure orders table exists with proper structure
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_owner_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_price DECIMAL(10,2) NOT NULL,
    order_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Ensure order_items table exists
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_order DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_store_owner_id ON orders(store_owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_available_quantity ON products(available_quantity);

-- 6. Enable RLS (Row Level Security) on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for orders table
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (store_owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders" ON orders
    FOR INSERT WITH CHECK (store_owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can update their own orders" ON orders
    FOR UPDATE USING (store_owner_id = auth.uid());

-- 8. Enable RLS on order_items table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for order_items table
DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;
CREATE POLICY "Users can view order items for their orders" ON order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE store_owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert order items for their orders" ON order_items;
CREATE POLICY "Users can insert order items for their orders" ON order_items
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT id FROM orders WHERE store_owner_id = auth.uid()
        )
    );

-- 10. Create a function to update product inventory
CREATE OR REPLACE FUNCTION update_product_inventory(
    product_id UUID,
    quantity_change INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    current_quantity INTEGER;
    new_quantity INTEGER;
BEGIN
    -- Get current quantity
    SELECT available_quantity INTO current_quantity
    FROM products
    WHERE id = product_id;
    
    IF current_quantity IS NULL THEN
        RAISE EXCEPTION 'Product not found: %', product_id;
    END IF;
    
    -- Calculate new quantity
    new_quantity := current_quantity + quantity_change;
    
    -- Ensure quantity doesn't go below 0
    IF new_quantity < 0 THEN
        new_quantity := 0;
    END IF;
    
    -- Update the product
    UPDATE products
    SET available_quantity = new_quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = product_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 11. Create a function to restore inventory when order is cancelled
CREATE OR REPLACE FUNCTION restore_order_inventory(order_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
    item_record RECORD;
BEGIN
    -- Loop through all order items and restore quantities
    FOR item_record IN 
        SELECT product_id, quantity 
        FROM order_items 
        WHERE order_items.order_id = restore_order_inventory.order_id
    LOOP
        -- Add back the quantity to the product
        PERFORM update_product_inventory(item_record.product_id, item_record.quantity);
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 12. Create a trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to orders table
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply the trigger to products table
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Sample data for testing (optional)
INSERT INTO products (
    id, name, description, price, discount_price, available_quantity, 
    image_url, category_id, created_at
) VALUES 
(
    gen_random_uuid(),
    'منتج تجريبي للمخزون',
    'منتج لاختبار نظام إدارة المخزون',
    25000,
    20000,
    100,
    'https://via.placeholder.com/300x200?text=Test+Product',
    (SELECT id FROM product_categories LIMIT 1),
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- 14. Final verification queries
SELECT 
    'products' as table_name,
    COUNT(*) as total_products,
    SUM(available_quantity) as total_inventory
FROM products
WHERE available_quantity > 0

UNION ALL

SELECT 
    'orders' as table_name,
    COUNT(*) as total_orders,
    0 as total_inventory
FROM orders

UNION ALL

SELECT 
    'order_items' as table_name,
    COUNT(*) as total_items,
    0 as total_inventory
FROM order_items;

-- Success message
SELECT 'نظام إدارة المخزون تم إعداده بنجاح! 🎉' as status; 