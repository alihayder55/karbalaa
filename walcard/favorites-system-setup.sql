-- Favorites System Setup for Walcard App
-- This creates the necessary database structure for user favorites

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_favorites_unique UNIQUE (user_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON public.user_favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON public.user_favorites(created_at);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own favorites" ON public.user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites" ON public.user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites" ON public.user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Function to add product to favorites
CREATE OR REPLACE FUNCTION public.add_to_favorites(p_user_id UUID, p_product_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if already in favorites
    IF EXISTS (SELECT 1 FROM user_favorites WHERE user_id = p_user_id AND product_id = p_product_id) THEN
        result := json_build_object(
            'success', false,
            'message', 'المنتج موجود في المفضلة مسبقاً',
            'already_favorite', true
        );
        RETURN result;
    END IF;
    
    -- Add to favorites
    INSERT INTO user_favorites (user_id, product_id)
    VALUES (p_user_id, p_product_id);
    
    result := json_build_object(
        'success', true,
        'message', 'تم إضافة المنتج إلى المفضلة',
        'already_favorite', false
    );
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    result := json_build_object(
        'success', false,
        'message', 'حدث خطأ أثناء إضافة المنتج للمفضلة',
        'error', SQLERRM
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove product from favorites
CREATE OR REPLACE FUNCTION public.remove_from_favorites(p_user_id UUID, p_product_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    deleted_count INTEGER;
BEGIN
    -- Remove from favorites
    DELETE FROM user_favorites 
    WHERE user_id = p_user_id AND product_id = p_product_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count = 0 THEN
        result := json_build_object(
            'success', false,
            'message', 'المنتج غير موجود في المفضلة',
            'was_favorite', false
        );
    ELSE
        result := json_build_object(
            'success', true,
            'message', 'تم إزالة المنتج من المفضلة',
            'was_favorite', true
        );
    END IF;
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    result := json_build_object(
        'success', false,
        'message', 'حدث خطأ أثناء إزالة المنتج من المفضلة',
        'error', SQLERRM
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle favorite status
CREATE OR REPLACE FUNCTION public.toggle_favorite(p_user_id UUID, p_product_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    is_favorite BOOLEAN;
BEGIN
    -- Check if product is currently in favorites
    SELECT EXISTS (
        SELECT 1 FROM user_favorites 
        WHERE user_id = p_user_id AND product_id = p_product_id
    ) INTO is_favorite;
    
    IF is_favorite THEN
        -- Remove from favorites
        SELECT remove_from_favorites(p_user_id, p_product_id) INTO result;
    ELSE
        -- Add to favorites
        SELECT add_to_favorites(p_user_id, p_product_id) INTO result;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's favorite products with details
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
        p.name_ar as product_name_ar,
        p.description as product_description,
        p.price,
        p.discount_price,
        p.image_url,
        p.available_quantity,
        pc.name as category_name,
        pc.name_ar as category_name_ar,
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

-- Function to check if product is favorite for user
CREATE OR REPLACE FUNCTION public.is_product_favorite(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_favorites 
        WHERE user_id = p_user_id AND product_id = p_product_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get favorites count for user
CREATE OR REPLACE FUNCTION public.get_favorites_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_result
    FROM user_favorites uf
    JOIN products p ON uf.product_id = p.id
    WHERE uf.user_id = p_user_id
    AND p.is_active = true;
    
    RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_favorites TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_to_favorites(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_from_favorites(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_favorite(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_favorites(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_product_favorite(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_favorites_count(UUID) TO anon, authenticated; 