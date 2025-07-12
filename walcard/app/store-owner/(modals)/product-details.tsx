import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
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
  available_quantity: number;
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
          available_quantity,
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

    if (quantity > product.available_quantity) {
      Alert.alert('خطأ', 'الكمية المطلوبة غير متوفرة');
      return;
    }

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

    if (quantity > product.available_quantity) {
      Alert.alert('خطأ', 'الكمية المطلوبة غير متوفرة');
      return;
    }

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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={80} color="#ccc" />
          <Text style={styles.errorTitle}>خطأ</Text>
          <Text style={styles.errorText}>لم يتم العثور على المنتج</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>العودة</Text>
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
        <Text style={styles.headerTitle}>تفاصيل المنتج</Text>
        <TouchableOpacity onPress={() => router.push('/store-owner/cart')}>
          <MaterialIcons name="shopping-cart" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="image" size={80} color="#ccc" />
              <Text style={styles.imagePlaceholderText}>لا توجد صورة</Text>
            </View>
          )}
          
          {/* Favorite Button */}
          <View style={styles.favoriteButtonContainer}>
            <FavoriteButton 
              productId={product.id} 
              size={24}
              showToast={true}
            />
          </View>

          {/* Discount Badge */}
          {product.discount_price && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{getDiscountPercentage(product.price, product.discount_price)}%
              </Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          
          {/* Price */}
          <View style={styles.priceContainer}>
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
              <Text style={styles.price}>
                {formatPrice(product.price)}
              </Text>
            )}
          </View>

          {/* Availability */}
          <View style={styles.availabilityContainer}>
            <MaterialIcons 
              name="inventory" 
              size={20} 
              color={product.available_quantity > 0 ? "#28A745" : "#DC3545"} 
            />
            <Text style={[
              styles.availabilityText,
              { color: product.available_quantity > 0 ? "#28A745" : "#DC3545" }
            ]}>
              {product.available_quantity > 0 
                ? `متوفر (${product.available_quantity} قطعة)` 
                : 'غير متوفر'
              }
            </Text>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>الوصف</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          {/* Quantity Selector */}
          {product.available_quantity > 0 && (
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>الكمية:</Text>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <MaterialIcons name="remove" size={20} color="#FF6B35" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.min(product.available_quantity, quantity + 1))}
                >
                  <MaterialIcons name="add" size={20} color="#FF6B35" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {product.available_quantity > 0 && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.addToCartButton]}
            onPress={handleAddToCart}
            disabled={addingToCart}
          >
            {addingToCart ? (
              <ActivityIndicator size="small" color="#FF6B35" />
            ) : (
              <>
                <MaterialIcons name="add-shopping-cart" size={20} color="#FF6B35" />
                <Text style={[styles.actionButtonText, styles.addToCartText]}>
                  إضافة للسلة
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.buyNowButton]}
            onPress={handleBuyNow}
            disabled={addingToCart}
          >
            <MaterialIcons name="shopping-cart-checkout" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, styles.buyNowText]}>
              اشتري الآن
            </Text>
          </TouchableOpacity>
        </View>
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
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: '#fff',
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
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 16,
    color: '#999',
  },
  favoriteButtonContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#DC3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productInfo: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    lineHeight: 32,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  discountPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginRight: 12,
  },
  originalPrice: {
    fontSize: 20,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  availabilityText: {
    fontSize: 16,
    marginLeft: 8,
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
  },
  quantityLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
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
    minWidth: 32,
    textAlign: 'center',
  },
  actionsContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  addToCartButton: {
    backgroundColor: '#fff',
    borderColor: '#FF6B35',
  },
  buyNowButton: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addToCartText: {
    color: '#FF6B35',
  },
  buyNowText: {
    color: '#fff',
  },
}); 