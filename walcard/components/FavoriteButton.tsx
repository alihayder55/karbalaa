import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/auth-helpers';

interface FavoriteButtonProps {
  productId: string;
  size?: number;
  showToast?: boolean;
  style?: any;
  onToggle?: (isFavorite: boolean) => void;
}

export default function FavoriteButton({ 
  productId, 
  size = 24, 
  showToast = false, 
  style,
  onToggle 
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFavoriteStatus();
  }, [productId]);

  const checkFavoriteStatus = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setIsFavorite(false);
        return;
      }

      console.log('🔍 Checking favorite status for product:', productId);

      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', currentUser.user_id)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error checking favorite status:', error);
        setIsFavorite(false);
        return;
      }

      const favStatus = !!data;
      console.log('✅ Favorite status for', productId, ':', favStatus);
      setIsFavorite(favStatus);

    } catch (error) {
      console.error('❌ Exception checking favorite status:', error);
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    if (loading) return;

    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        if (showToast) {
          Alert.alert('تنبيه', 'يجب تسجيل الدخول أولاً');
        }
        return;
      }

      setLoading(true);
      console.log('🔄 Toggling favorite for product:', productId, 'current state:', isFavorite);

      if (isFavorite) {
        // إزالة من المفضلة
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', currentUser.user_id)
          .eq('product_id', productId);

        if (error) {
          console.error('❌ Error removing favorite:', error);
          if (showToast) {
            Alert.alert('خطأ', 'فشل في إزالة المنتج من المفضلة');
          }
          return;
        }

        console.log('✅ Product removed from favorites');
        setIsFavorite(false);
        onToggle?.(false);
        
        if (showToast) {
          Alert.alert('تم', 'تم إزالة المنتج من المفضلة');
        }

      } else {
        // إضافة إلى المفضلة
        const { error } = await supabase
          .from('user_favorites')
          .insert({ 
            user_id: currentUser.user_id, 
            product_id: productId 
          });

        if (error) {
          console.error('❌ Error adding favorite:', error);
          if (showToast) {
            Alert.alert('خطأ', 'فشل في إضافة المنتج إلى المفضلة');
          }
          return;
        }

        console.log('✅ Product added to favorites');
        setIsFavorite(true);
        onToggle?.(true);
        
        if (showToast) {
          Alert.alert('تم', 'تم إضافة المنتج إلى المفضلة');
        }
      }

    } catch (error) {
      console.error('❌ Exception in toggleFavorite:', error);
      if (showToast) {
        Alert.alert('خطأ', 'حدث خطأ غير متوقع');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.favoriteButton, style]}
      onPress={toggleFavorite}
      disabled={loading}
    >
      <MaterialIcons
        name={isFavorite ? 'favorite' : 'favorite-border'}
        size={size}
        color={isFavorite ? '#FF6B35' : '#999'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  favoriteButton: {
    padding: 4,
  },
}); 