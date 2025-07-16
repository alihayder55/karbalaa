import { supabase } from './supabase';
import { getCurrentUser } from './auth-helpers';

export interface FavoriteProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  is_active: boolean;
  category_id?: string;
  merchant_id?: string;
}

class FavoritesManager {
  private static instance: FavoritesManager;
  private listeners: Map<string, Set<(isFavorite: boolean) => void>> = new Map();

  static getInstance(): FavoritesManager {
    if (!FavoritesManager.instance) {
      FavoritesManager.instance = new FavoritesManager();
    }
    return FavoritesManager.instance;
  }

  /**
   * Subscribe to favorite status changes for a product
   */
  subscribe(productId: string, callback: (isFavorite: boolean) => void): () => void {
    if (!this.listeners.has(productId)) {
      this.listeners.set(productId, new Set());
    }
    
    this.listeners.get(productId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(productId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(productId);
        }
      }
    };
  }

  /**
   * Notify all listeners about a favorite status change
   */
  notify(productId: string, isFavorite: boolean) {
    const callbacks = this.listeners.get(productId);
    if (callbacks) {
      callbacks.forEach(callback => callback(isFavorite));
    }
  }

  /**
   * Check if a product is in favorites
   */
  async isFavorite(productId: string): Promise<boolean> {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return false;

      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', currentUser.user_id)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking favorite status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Exception checking favorite status:', error);
      return false;
    }
  }

  /**
   * Toggle favorite status for a product
   */
  async toggleFavorite(productId: string): Promise<{ success: boolean; isFavorite: boolean; message: string }> {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          isFavorite: false,
          message: 'يجب تسجيل الدخول أولاً'
        };
      }

      const isCurrentlyFavorite = await this.isFavorite(productId);

      if (isCurrentlyFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', currentUser.user_id)
          .eq('product_id', productId);

        if (error) {
          console.error('Error removing favorite:', error);
          return {
            success: false,
            isFavorite: true,
            message: 'فشل في إزالة المنتج من المفضلة'
          };
        }

        this.notify(productId, false);
        return {
          success: true,
          isFavorite: false,
          message: 'تم إزالة المنتج من المفضلة'
        };
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert({ 
            user_id: currentUser.user_id, 
            product_id: productId 
          });

        if (error) {
          console.error('Error adding favorite:', error);
          return {
            success: false,
            isFavorite: false,
            message: 'فشل في إضافة المنتج إلى المفضلة'
          };
        }

        this.notify(productId, true);
        return {
          success: true,
          isFavorite: true,
          message: 'تم إضافة المنتج إلى المفضلة'
        };
      }
    } catch (error) {
      console.error('Exception in toggleFavorite:', error);
      return {
        success: false,
        isFavorite: false,
        message: 'حدث خطأ غير متوقع'
      };
    }
  }

  /**
   * Get all favorite products for current user
   */
  async getFavorites(): Promise<FavoriteProduct[]> {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return [];

      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          id,
          product_id,
          created_at,
          products (
            name,
            description,
            price,
            discount_price,
            image_url,
            is_active,
            category_id,
            merchant_id
          )
        `)
        .eq('user_id', currentUser.user_id);

      if (error) {
        console.error('Error loading favorites:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.product_id,
        name: item.products?.name || '',
        description: item.products?.description,
        price: item.products?.price || 0,
        discount_price: item.products?.discount_price,
        image_url: item.products?.image_url,
        is_active: item.products?.is_active || false,
        category_id: item.products?.category_id,
        merchant_id: item.products?.merchant_id
      }));
    } catch (error) {
      console.error('Exception loading favorites:', error);
      return [];
    }
  }
}

export const favoritesManager = FavoritesManager.getInstance(); 