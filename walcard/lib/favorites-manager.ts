import { supabase } from './supabase';
import { getCurrentUser } from './auth-helpers';

export interface FavoriteProduct {
  favorite_id: string;
  product_id: string;
  product_name: string;
  product_name_ar?: string;
  product_description?: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  available_quantity: number;
  category_name?: string;
  category_name_ar?: string;
  merchant_id: string;
  added_at: string;
}

export interface FavoriteResult {
  success: boolean;
  message: string;
  already_favorite?: boolean;
  was_favorite?: boolean;
  error?: string;
}

class FavoritesManager {
  /**
   * Add product to favorites
   */
  async addToFavorites(productId: string): Promise<FavoriteResult> {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          message: 'يجب تسجيل الدخول أولاً'
        };
      }

      console.log('❤️ Adding product to favorites:', productId);

      const { data, error } = await supabase.rpc('add_to_favorites', {
        p_user_id: currentUser.user_id,
        p_product_id: productId
      });

      if (error) {
        console.error('Error adding to favorites:', error);
        return {
          success: false,
          message: 'حدث خطأ أثناء إضافة المنتج للمفضلة'
        };
      }

      console.log('✅ Add to favorites result:', data);
      return data as FavoriteResult;
    } catch (error) {
      console.error('Error in addToFavorites:', error);
      return {
        success: false,
        message: 'حدث خطأ غير متوقع'
      };
    }
  }

  /**
   * Remove product from favorites
   */
  async removeFromFavorites(productId: string): Promise<FavoriteResult> {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          message: 'يجب تسجيل الدخول أولاً'
        };
      }

      console.log('💔 Removing product from favorites:', productId);

      const { data, error } = await supabase.rpc('remove_from_favorites', {
        p_user_id: currentUser.user_id,
        p_product_id: productId
      });

      if (error) {
        console.error('Error removing from favorites:', error);
        return {
          success: false,
          message: 'حدث خطأ أثناء إزالة المنتج من المفضلة'
        };
      }

      console.log('✅ Remove from favorites result:', data);
      return data as FavoriteResult;
    } catch (error) {
      console.error('Error in removeFromFavorites:', error);
      return {
        success: false,
        message: 'حدث خطأ غير متوقع'
      };
    }
  }

  /**
   * Toggle favorite status (add if not favorite, remove if favorite)
   */
  async toggleFavorite(productId: string): Promise<FavoriteResult> {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          message: 'يجب تسجيل الدخول أولاً'
        };
      }

      console.log('🔄 Toggling favorite status for product:', productId);

      const { data, error } = await supabase.rpc('toggle_favorite', {
        p_user_id: currentUser.user_id,
        p_product_id: productId
      });

      if (error) {
        console.error('Error toggling favorite:', error);
        return {
          success: false,
          message: 'حدث خطأ أثناء تحديث المفضلة'
        };
      }

      console.log('✅ Toggle favorite result:', data);
      return data as FavoriteResult;
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      return {
        success: false,
        message: 'حدث خطأ غير متوقع'
      };
    }
  }

  /**
   * Check if product is in user's favorites
   */
  async isFavorite(productId: string): Promise<boolean> {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return false;
      }

      const { data, error } = await supabase.rpc('is_product_favorite', {
        p_user_id: currentUser.user_id,
        p_product_id: productId
      });

      if (error) {
        console.error('Error checking favorite status:', error);
        return false;
      }

      return data as boolean;
    } catch (error) {
      console.error('Error in isFavorite:', error);
      return false;
    }
  }

  /**
   * Get user's favorite products
   */
  async getFavorites(): Promise<FavoriteProduct[]> {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log('❌ No current user for favorites');
        return [];
      }

      console.log('📋 Loading user favorites...');

      const { data, error } = await supabase.rpc('get_user_favorites', {
        p_user_id: currentUser.user_id
      });

      if (error) {
        console.error('Error loading favorites:', error);
        return [];
      }

      console.log('✅ Loaded favorites:', data?.length || 0, 'products');
      return (data as FavoriteProduct[]) || [];
    } catch (error) {
      console.error('Error in getFavorites:', error);
      return [];
    }
  }

  /**
   * Get favorites count for current user
   */
  async getFavoritesCount(): Promise<number> {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return 0;
      }

      const { data, error } = await supabase.rpc('get_favorites_count', {
        p_user_id: currentUser.user_id
      });

      if (error) {
        console.error('Error getting favorites count:', error);
        return 0;
      }

      return (data as number) || 0;
    } catch (error) {
      console.error('Error in getFavoritesCount:', error);
      return 0;
    }
  }

  /**
   * Get multiple products' favorite status
   */
  async getFavoriteStatuses(productIds: string[]): Promise<Record<string, boolean>> {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || productIds.length === 0) {
        return {};
      }

      const results: Record<string, boolean> = {};

      // Check each product (could be optimized with a batch function if needed)
      await Promise.all(
        productIds.map(async (productId) => {
          results[productId] = await this.isFavorite(productId);
        })
      );

      return results;
    } catch (error) {
      console.error('Error in getFavoriteStatuses:', error);
      return {};
    }
  }

  /**
   * Clear all favorites for current user (useful for logout)
   */
  async clearAllFavorites(): Promise<boolean> {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return false;
      }

      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', currentUser.user_id);

      if (error) {
        console.error('Error clearing favorites:', error);
        return false;
      }

      console.log('✅ All favorites cleared');
      return true;
    } catch (error) {
      console.error('Error in clearAllFavorites:', error);
      return false;
    }
  }
}

export const favoritesManager = new FavoritesManager(); 