import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { cartManager } from '../../../lib/cart-manager';
import FavoriteButton from '../../../components/FavoriteButton';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  is_active: boolean;
  category_id: string;
  merchant_id: string;
}

export default function StoreOwnerProductDetails() {
  const params = useLocalSearchParams();
  const productId = params.productId as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProductDetails();
    }
  }, [productId]);

  const loadProductDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          discount_price,
          image_url,
          is_active,
          category_id,
          merchant_id
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error loading product details:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل تفاصيل المنتج');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setAddingToCart(true);
      const result = await cartManager.addToCart(product.id, quantity);
      
      if (result.success) {
        Alert.alert(
          'تم الإضافة',
          `تم إضافة ${quantity} من ${product.name} إلى السلة`,
          [
            { text: 'متابعة التسوق', onPress: () => router.back() },
            { text: 'عرض السلة', onPress: () => router.push('/store-owner/cart') },
          ]
        );
      } else {
        Alert.alert('خطأ', result.message);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة المنتج إلى السلة');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    try {
      // Add to cart first
      await cartManager.addToCart(product.id, quantity);
      // Then go to checkout
      router.push('/store-owner/(modals)/checkout');
    } catch (error) {
      console.error('Error with buy now:', error);
      Alert.alert('خطأ', 'حدث خطأ، يرجى المحاولة مرة أخرى');
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} د.ع`;
  };

  const getDiscountPercentage = (originalPrice: number, discountPrice: number) => {
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#40E0D0" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={80} color="#ccc" />
          <Text style={styles.errorTitle}>خطأ</Text>
          <Text style={styles.errorText}>لم يتم العثور على المنتج</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/store-owner')}>
            <Text style={styles.backButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/store-owner')}>
          <MaterialIcons name="arrow-back" size={24} color="#40E0D0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل المنتج</Text>
        <TouchableOpacity onPress={() => router.push('/store-owner/cart')}>
          <MaterialIcons name="shopping-cart" size={24} color="#40E0D0" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="inventory" size={80} color="#666" />
              <Text style={styles.imagePlaceholderText}>لا توجد صورة</Text>
            </View>
          )}
          
          {/* Favorite Button */}
          <View style={styles.favoriteButtonContainer}>
            <FavoriteButton 
              productId={product.id} 
              size={24}
              showToast={true}
              key={`favorite-${product.id}`}
              onToggle={(isFavorite) => {
                console.log(`Favorite toggled for product ${product.id}: ${isFavorite}`);
              }}
            />
          </View>

          {/* Discount Badge */}
          {product.discount_price && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {getDiscountPercentage(product.price, product.discount_price)}% خصم
              </Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.priceContainer}>
            {product.discount_price ? (
              <>
                <Text style={styles.discountPrice}>
                  {formatPrice(product.discount_price)} د.ع
                </Text>
                <Text style={styles.originalPrice}>
                  {formatPrice(product.price)} د.ع
                </Text>
              </>
            ) : (
              <Text style={styles.price}>
                {formatPrice(product.price)} د.ع
              </Text>
            )}
          </View>

          <View style={styles.availabilityContainer}>
            <MaterialIcons 
              name={product.is_active ? "check-circle" : "cancel"} 
              size={20} 
              color={product.is_active ? "#28A745" : "#ff4757"} 
            />
            <Text style={[
              styles.availabilityText,
              { color: product.is_active ? "#28A745" : "#ff4757" }
            ]}>
              {product.is_active ? 'متوفر' : 'غير متوفر'}
            </Text>
          </View>

          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>الوصف</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>الكمية:</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <MaterialIcons name="remove" size={20} color="#666" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <MaterialIcons name="add" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Action Buttons - Inside Page Content */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
            disabled={addingToCart || !product.is_active}
          >
            <MaterialIcons name="shopping-cart" size={32} color="#fff" />
            <Text style={styles.addToCartText}>
              {addingToCart ? 'جاري الإضافة...' : 'إضافة إلى السلة'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.buyNowButton}
            onPress={handleBuyNow}
            disabled={!product.is_active}
          >
            <MaterialIcons name="shopping-cart-checkout" size={32} color="#fff" />
            <Text style={styles.buyNowText}>شراء الآن</Text>
          </TouchableOpacity>
        </View>
        
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#40E0D0',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: '#f8f9fa',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  favoriteButtonContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#ff4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    lineHeight: 30,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#40E0D0',
  },
  discountPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#40E0D0',
  },
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  actionButtons: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonsContainer: {
    padding: 20,
    gap: 20,
    backgroundColor: '#fff',
    marginTop: 20,
  },
  fixedActionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  addToCartButton: {
    backgroundColor: '#40E0D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderRadius: 20,
    gap: 16,
    shadowColor: '#40E0D0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 3,
    borderColor: '#40E0D0',
  },
  addToCartText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  buyNowButton: {
    backgroundColor: '#1ABC9C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderRadius: 20,
    gap: 16,
    shadowColor: '#1ABC9C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 3,
    borderColor: '#1ABC9C',
  },
  buyNowText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  bottomSpacing: {
    height: 120,
  },
}); 