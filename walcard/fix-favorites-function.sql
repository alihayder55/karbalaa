-- Fix the get_user_favorites function to handle missing name_ar column

CREATE OR REPLACE FUNCTION public.get_user_favorites(p_user_id UUID)
RETURNS TABLE (
    favorite_id UUID,
    product_id UUID,
    product_name TEXT,
    product_name_ar TEXT,
    product_description TEXT,
    price NUMERIC,
    discount_price NUMERIC,
    image_url TEXT,
    available_quantity INTEGER,
    category_name TEXT,
    category_name_ar TEXT,
    merchant_id UUID,
    added_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uf.id as favorite_id,
        p.id as product_id,
        p.name as product_name,
        COALESCE(p.name_ar, p.name) as product_name_ar, -- Use name if name_ar doesn't exist
        p.description as product_description,
        p.price,
        p.discount_price,
        p.image_url,
        p.available_quantity,
        pc.name as category_name,
        COALESCE(pc.name_ar, pc.name) as category_name_ar, -- Use name if name_ar doesn't exist
        p.merchant_id,
        uf.created_at as added_at
    FROM user_favorites uf
    JOIN products p ON uf.product_id = p.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE uf.user_id = p_user_id
    AND p.is_active = true
    ORDER BY uf.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 