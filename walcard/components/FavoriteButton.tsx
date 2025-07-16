import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { favoritesManager } from '../lib/favorites-manager';

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
    
    // Subscribe to favorite status changes
    const unsubscribe = favoritesManager.subscribe(productId, (newStatus) => {
      setIsFavorite(newStatus);
    });

    return unsubscribe;
  }, [productId]);

  const checkFavoriteStatus = async () => {
    try {
      const status = await favoritesManager.isFavorite(productId);
      setIsFavorite(status);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const result = await favoritesManager.toggleFavorite(productId);
      
      if (result.success) {
        setIsFavorite(result.isFavorite);
        onToggle?.(result.isFavorite);
        
        if (showToast) {
          Alert.alert('تم', result.message);
        }
      } else {
        if (showToast) {
          Alert.alert('خطأ', result.message);
        }
      }
    } catch (error) {
      console.error('Exception in toggleFavorite:', error);
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
        color={isFavorite ? '#40E0D0' : '#999'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  favoriteButton: {
    padding: 4,
  },
}); 