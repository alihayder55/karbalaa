import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { cartManager, CartItem } from '../../lib/cart-manager';
import { getCurrentUser } from '../../lib/auth-helpers';

export default function StoreOwnerCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkUserAndLoadCart();
  }, []);

  const checkUserAndLoadCart = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log('❌ No user logged in for cart');
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      await loadCart();
    } catch (error) {
      console.error('Error checking user and loading cart:', error);
      setLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      const cart = await cartManager.getCartWithDetails();
      setCartItems(cart);
      console.log('✅ Cart loaded:', cart.length, 'items');
    } catch (error) {
      console.error('Error loading cart:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل السلة');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCart();
    setRefreshing(false);
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    try {
      const result = await cartManager.updateQuantity(productId, newQuantity);
      if (result.success) {
        await loadCart(); // Reload cart
      } else {
        Alert.alert('خطأ', result.message);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الكمية');
    }
  };

  const removeItem = (productId: string) => {
    Alert.alert(
      'حذف المنتج',
      'هل أنت متأكد من حذف هذا المنتج من السلة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive', 
          onPress: async () => {
            const result = await cartManager.removeFromCart(productId);
            if (result.success) {
              await loadCart();
            } else {
              Alert.alert('خطأ', result.message);
            }
          }
        },
      ]
    );
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      if (!item.product) return total;
      const price = item.product.discount_price || item.product.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('السلة فارغة', 'يرجى إضافة منتجات إلى السلة أولاً');
      return;
    }
    router.push('/store-owner/(modals)/checkout');
  };

  const handleLoginPress = () => {
    router.push('/auth/unified-login');
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} د.ع`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>جاري تحميل السلة...</Text>
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
          <Text style={styles.headerTitle}>سلة المشتريات</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.loginRequiredContainer}>
          <MaterialIcons name="login" size={80} color="#ccc" />
          <Text style={styles.loginRequiredTitle}>تسجيل الدخول مطلوب</Text>
          <Text style={styles.loginRequiredText}>
            يجب تسجيل الدخول للوصول إلى سلة المشتريات
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
        <Text style={styles.headerTitle}>سلة المشتريات</Text>
        <View style={{ width: 24 }} />
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-cart" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>السلة فارغة</Text>
          <Text style={styles.emptyText}>
            لم تقم بإضافة أي منتجات إلى السلة بعد
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/store-owner')}
          >
            <Text style={styles.browseButtonText}>تصفح المنتجات</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.itemImageContainer}>
                  {item.product?.image_url ? (
                    <Image source={{ uri: item.product.image_url }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <MaterialIcons name="image" size={24} color="#ccc" />
                    </View>
                  )}
                </View>
                
                <View style={styles.itemContent}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product?.name || 'منتج غير متوفر'}
                  </Text>
                  {item.product && (
                    <View style={styles.priceContainer}>
                      {item.product.discount_price ? (
                        <>
                          <Text style={styles.discountPrice}>
                            {formatPrice(item.product.discount_price)}
                          </Text>
                          <Text style={styles.originalPrice}>
                            {formatPrice(item.product.price)}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.price}>
                          {formatPrice(item.product.price)}
                        </Text>
                      )}
                    </View>
                  )}
                  
                  {/* Availability status */}
                  {item.product && (
                    <View style={styles.availabilityContainer}>
                      <MaterialIcons 
                        name="inventory" 
                        size={14} 
                        color={item.product.available_quantity > 0 ? "#28A745" : "#DC3545"} 
                      />
                      <Text style={[
                        styles.availabilityText,
                        { color: item.product.available_quantity > 0 ? "#28A745" : "#DC3545" }
                      ]}>
                        {item.product.available_quantity > 0 
                          ? `متوفر (${item.product.available_quantity})` 
                          : 'غير متوفر'
                        }
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.itemActions}>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.product_id, item.quantity - 1)}
                    >
                      <MaterialIcons name="remove" size={20} color="#FF6B35" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
                      disabled={item.product && item.quantity >= item.product.available_quantity}
                    >
                      <MaterialIcons 
                        name="add" 
                        size={20} 
                        color={item.product && item.quantity >= item.product.available_quantity ? "#ccc" : "#FF6B35"} 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(item.product_id)}
                  >
                    <MaterialIcons name="delete" size={20} color="#DC3545" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>المجموع:</Text>
              <Text style={styles.totalPrice}>{formatPrice(getTotalPrice())}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>إتمام الطلب</Text>
              <MaterialIcons name="shopping-cart-checkout" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    fontWeight: '600',
  },
  cartItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
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
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  itemActions: {
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  checkoutButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
}); 