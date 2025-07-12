import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../lib/auth-helpers';
import FavoriteButton from '../../components/FavoriteButton';

const { width } = Dimensions.get('window');

interface FavoriteProduct {
  favorite_id: string;
  product_id: string;
  product_name: string;
  product_name_ar?: string;
  product_description?: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  available_quantity: number;
  added_at: string;
}

export default function StoreOwnerFavorites() {
  const router = useRouter();
  const [favoriteProducts, setFavoriteProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    console.log('🎯 Favorites page mounted - checking user and loading favorites');
    checkUserAndLoadFavorites();
  }, []);

  // Reload favorites when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🎯 Favorites page focused - reloading favorites');
      if (isLoggedIn) {
        loadFavorites();
      }
    }, [isLoggedIn])
  );

  const checkUserAndLoadFavorites = async () => {
    try {
      const currentUser = getCurrentUser();
      console.log('🔍 Checking current user:', currentUser?.user_id || 'No user');
      
      if (!currentUser) {
        console.log('❌ No user logged in for favorites page');
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      console.log('✅ User logged in:', currentUser.user_id);
      setIsLoggedIn(true);
      await loadFavorites();
    } catch (error) {
      console.error('❌ Error checking user and loading favorites:', error);
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading favorites from database...');
      
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log('❌ No user for loading favorites');
        setFavoriteProducts([]);
        setLoading(false);
        return;
      }

      console.log('🔍 Loading favorites for user:', currentUser.user_id);

      // استعلام مباشر لجلب المفضلة
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          id,
          product_id,
          created_at,
          products (
            id,
            name,
            price,
            image_url,
            available_quantity
          )
        `)
        .eq('user_id', currentUser.user_id);

      if (error) {
        console.error('❌ Error loading favorites:', error);
        setFavoriteProducts([]);
        return;
      }

      // تحويل البيانات
      const formattedData = data?.map((item: any) => ({
        favorite_id: item.id,
        product_id: item.product_id,
        product_name: item.products?.name || 'منتج غير معروف',
        price: item.products?.price || 0,
        image_url: item.products?.image_url,
        available_quantity: item.products?.available_quantity || 0,
        added_at: item.created_at,
      })) || [];
      
      console.log('📊 Favorites result:', {
        count: formattedData.length,
        favorites: formattedData.map((f: FavoriteProduct) => ({ id: f.product_id, name: f.product_name }))
      });
      
      setFavoriteProducts(formattedData);
      
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل المنتجات المفضلة');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleFavoriteToggle = async (productId: string, isFavorite: boolean) => {
    console.log('🔄 Favorite toggled in favorites page:', productId, 'isFavorite:', isFavorite);
    
    // If product was removed from favorites, reload the list
    if (!isFavorite) {
      console.log('🗑️ Product removed from favorites, reloading list');
      await loadFavorites();
    }
  };

  const handleProductPress = (product: FavoriteProduct) => {
    console.log('👆 Product pressed:', product.product_id);
    router.push({
      pathname: '/store-owner/(modals)/product-details',
      params: { productId: product.product_id }
    });
  };

  const handleLoginPress = () => {
    console.log('🔑 Login button pressed');
    router.push('/auth/unified-login');
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} د.ع`;
  };

  const getDiscountPercentage = (originalPrice: number, discountPrice: number) => {
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>جاري تحميل المفضلة...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>المنتجات المفضلة</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.loginRequiredContainer}>
          <MaterialIcons name="favorite" size={80} color="#ccc" />
          <Text style={styles.loginRequiredTitle}>تسجيل الدخول مطلوب</Text>
          <Text style={styles.loginRequiredText}>
            يجب تسجيل الدخول لعرض المنتجات المفضلة
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
            <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المنتجات المفضلة</Text>
        <View style={{ width: 24 }} />
      </View>

      {favoriteProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="favorite-border" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>لا توجد منتجات مفضلة</Text>
          <Text style={styles.emptyText}>
            لم تقم بإضافة أي منتجات إلى المفضلة بعد
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/store-owner')}
          >
            <Text style={styles.browseButtonText}>تصفح المنتجات</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.favoritesContainer}>
            <Text style={styles.favoritesCount}>
              لديك {favoriteProducts.length} منتج مفضل
            </Text>
            
            <View style={styles.productsGrid}>
              {favoriteProducts.map((product) => (
                <TouchableOpacity
                  key={product.favorite_id}
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
                        <MaterialIcons name="inventory" size={40} color="#ccc" />
                      </View>
                    )}
                    {product.discount_price && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>
                          {getDiscountPercentage(product.price, product.discount_price)}%
                        </Text>
                      </View>
                    )}
                    <View style={styles.favoriteButtonContainer}>
                      <FavoriteButton 
                        productId={product.product_id} 
                        size={18}
                        showToast={true}
                        style={styles.favoriteButtonStyle}
                        onToggle={(isFavorite) => handleFavoriteToggle(product.product_id, isFavorite)}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.productContent}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.product_name_ar || product.product_name}
                    </Text>
                    {product.product_description && (
                      <Text style={styles.productDescription} numberOfLines={1}>
                        {product.product_description}
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
                    <Text style={styles.productQuantity}>
                      المتوفر: {product.available_quantity || 0} قطعة
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  loginRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loginRequiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  loginRequiredText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  favoritesContainer: {
    padding: 20,
  },
  favoritesCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 50) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#DC3545',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  favoriteButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonStyle: {
    // This style is for the FavoriteButton component itself
  },
  productContent: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  productQuantity: {
    fontSize: 12,
    color: '#666',
  },
}); 