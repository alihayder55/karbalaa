import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { favoritesManager, FavoriteProduct } from '../../lib/favorites-manager';

export default function StoreOwnerFavorites() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingFavorites, setRemovingFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await favoritesManager.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('خطأ', 'فشل في تحميل المفضلة');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleProductPress = (product: FavoriteProduct) => {
    router.push({
      pathname: '/store-owner/(modals)/product-details',
      params: { productId: product.id }
    });
  };

  const handleRemoveFavorite = async (productId: string) => {
    try {
      setRemovingFavorites(prev => new Set(prev).add(productId));
      
      const result = await favoritesManager.toggleFavorite(productId);
      
      if (result.success) {
        // Remove from local state
        setFavorites(prev => prev.filter(p => p.id !== productId));
      } else {
        Alert.alert('خطأ', result.message);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('خطأ', 'فشل في إزالة المنتج من المفضلة');
    } finally {
      setRemovingFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-EG');
  };

  const getDiscountPercentage = (originalPrice: number, discountPrice: number) => {
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  };

  const renderProductItem = (product: FavoriteProduct) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productCard}
      onPress={() => handleProductPress(product)}
    >
      <View style={styles.productImageContainer}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <MaterialIcons name="inventory" size={32} color="#666" />
          </View>
        )}
        
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFavorite(product.id)}
            disabled={removingFavorites.has(product.id)}
          >
            {removingFavorites.has(product.id) ? (
              <ActivityIndicator size={16} color="#ff4757" />
            ) : (
              <MaterialIcons name="delete" size={18} color="#ff4757" />
            )}
          </TouchableOpacity>
          
          {product.discount_price && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {getDiscountPercentage(product.price, product.discount_price)}%
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.productContent}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        {product.description && (
          <Text style={styles.productDescription} numberOfLines={1}>
            {product.description}
          </Text>
        )}
        <View style={styles.productPriceContainer}>
          {product.discount_price ? (
            <>
              <Text style={styles.discountPrice}>
                {formatPrice(product.discount_price)}
              </Text>
              <Text style={styles.originalPrice}>
                {formatPrice(product.price)}
              </Text>
            </>
          ) : (
            <Text style={styles.productPrice}>
              {formatPrice(product.price)}
            </Text>
          )}
        </View>
        <View style={styles.availabilityContainer}>
          <MaterialIcons 
            name={product.is_active ? "check-circle" : "cancel"} 
            size={14} 
            color={product.is_active ? "#28A745" : "#DC3545"} 
          />
          <Text style={[
            styles.availabilityText,
            { color: product.is_active ? "#28A745" : "#DC3545" }
          ]}>
            {product.is_active ? 'متوفر' : 'غير متوفر'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" backgroundColor="#fff" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>المفضلة</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#40E0D0" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>المفضلة</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#40E0D0']}
            tintColor="#40E0D0"
          />
        }
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="favorite-border" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>لا توجد منتجات في المفضلة</Text>
            <Text style={styles.emptyText}>
              أضف المنتجات التي تحبها إلى المفضلة لتجدها بسهولة لاحقاً
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/store-owner')}
            >
              <MaterialIcons name="shopping-bag" size={20} color="#fff" />
              <Text style={styles.browseButtonText}>تصفح المنتجات</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="favorite" size={24} color="#40E0D0" />
              <Text style={styles.sectionTitle}>
                المنتجات المفضلة ({favorites.length})
              </Text>
            </View>
            
            <View style={styles.productsGrid}>
              {favorites.map(renderProductItem)}
            </View>
          </View>
        )}
        
        {/* Bottom Spacing for Tab Bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  productCard: {
    width: '48%', // Adjust as needed for 2 columns
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
    height: 120,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productActions: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    padding: 8,
  },
  discountBadge: {
    backgroundColor: '#ff4757',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productContent: {
    padding: 10,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 16,
  },
  productDescription: {
    fontSize: 10,
    color: '#666',
    marginBottom: 6,
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#40E0D0',
  },
  discountPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff4757',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 10,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  availabilityText: {
    fontSize: 12,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#40E0D0',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 120,
  },
}); 