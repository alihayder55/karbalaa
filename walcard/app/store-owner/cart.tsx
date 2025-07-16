import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#40E0D0" />
          <Text style={styles.loadingText}>جاري تحميل السلة...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/auth/unified-login')}>
            <MaterialIcons name="arrow-back" size={24} color="#40E0D0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>سلة المشتريات</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.loginRequiredContainer}>
          <MaterialIcons name="shopping-cart" size={80} color="#40E0D0" />
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/store-owner')}>
          <MaterialIcons name="arrow-back" size={24} color="#40E0D0" />
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
            <View style={styles.cartItemsContainer}>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  <View style={styles.itemImageContainer}>
                    {item.product?.image_url ? (
                      <Image source={{ uri: item.product.image_url }} style={styles.itemImage} />
                    ) : (
                      <View style={styles.itemImagePlaceholder}>
                        <MaterialIcons name="inventory" size={32} color="#666" />
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
                          name={item.product.is_active ? "check-circle" : "cancel"} 
                          size={14} 
                          color={item.product.is_active ? "#28A745" : "#DC3545"} 
                        />
                        <Text style={[
                          styles.availabilityText,
                          { color: item.product.is_active ? "#28A745" : "#DC3545" }
                        ]}>
                          {item.product.is_active ? 'متوفر' : 'غير متوفر'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.itemActions}>
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.product_id, Math.max(0, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                      >
                        <MaterialIcons 
                          name="remove" 
                          size={16} 
                          color={item.quantity <= 1 ? "#ccc" : "#40E0D0"} 
                        />
                      </TouchableOpacity>
                      
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
                      >
                        <MaterialIcons name="add" size={16} color="#40E0D0" />
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeItem(item.product_id)}
                    >
                      <MaterialIcons name="delete" size={20} color="#ff4757" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
          
          {/* Checkout Button - Inside Page Content */}
          <View style={styles.checkoutButtonContainer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>المجموع الكلي:</Text>
              <Text style={styles.totalPrice}>{formatPrice(getTotalPrice())}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
              disabled={cartItems.length === 0}
            >
              <MaterialIcons name="shopping-cart-checkout" size={32} color="#fff" />
              <Text style={styles.checkoutButtonText}>إتمام الطلب</Text>
            </TouchableOpacity>
          </View>
          
          {/* Bottom Spacing for Tab Bar */}
          <View style={styles.bottomSpacing} />
        </>
      )}

      {/* Remove Fixed Checkout Button */}
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
    marginTop: 24,
    marginBottom: 12,
  },
  loginRequiredText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#40E0D0',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
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
    backgroundColor: '#40E0D0',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#40E0D0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#40E0D0',
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  cartItemsContainer: {
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#40E0D0',
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#40E0D0',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkoutSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  checkoutButtonContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  fixedCheckoutSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#40E0D0',
  },
  checkoutButton: {
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
  checkoutButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  bottomSpacing: {
    height: 120,
  },
}); 