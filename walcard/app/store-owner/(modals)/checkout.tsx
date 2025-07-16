import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { cartManager, CartItem } from '../../../lib/cart-manager';
import { getCurrentUser } from '../../../lib/auth-helpers';

export default function StoreOwnerCheckout() {
  const [orderNotes, setOrderNotes] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const items = await cartManager.getCartWithDetails();
      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart items:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل عناصر السلة');
    } finally {
      setLoading(false);
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      if (!item.product) return total;
      const price = item.product.discount_price || item.product.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('السلة فارغة', 'يرجى إضافة منتجات إلى السلة أولاً');
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      setPlacing(true);
      
      const result = await cartManager.createOrderFromCart(orderNotes.trim() || undefined);
      
      if (result.success) {
        Alert.alert(
          'تم إنشاء الطلب بنجاح!',
          `رقم الطلب: ${result.orderId}\n\nسيتم التواصل معك قريباً لتأكيد الطلب وتفاصيل التوصيل.`,
          [
            { 
              text: 'حسناً', 
              onPress: () => {
                router.dismissAll();
                router.push('/store-owner/orders');
              }
            }
          ]
        );
      } else {
        Alert.alert('خطأ', result.message);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء الطلب');
    } finally {
      setPlacing(false);
    }
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
          <Text style={styles.loadingText}>جاري تحميل الطلب...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/store-owner')}>
            <MaterialIcons name="arrow-back" size={24} color="#40E0D0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إتمام الطلب</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-cart" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>السلة فارغة</Text>
          <Text style={styles.emptyText}>
            لا توجد منتجات في السلة لإتمام الطلب
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/store-owner')}
          >
            <Text style={styles.browseButtonText}>تصفح المنتجات</Text>
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
        <Text style={styles.headerTitle}>إتمام الطلب</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="shopping-cart" size={24} color="#40E0D0" />
            <Text style={styles.sectionTitle}>عناصر الطلب</Text>
          </View>
          
          {cartItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.itemImageContainer}>
                {item.product?.image_url ? (
                  <Image source={{ uri: item.product.image_url }} style={styles.itemImage} />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <MaterialIcons name="inventory" size={24} color="#666" />
                  </View>
                )}
              </View>
              
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product?.name || 'منتج غير متوفر'}
                </Text>
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemQuantity}>الكمية: {item.quantity}</Text>
                  {item.product && (
                    <Text style={styles.itemPrice}>
                      {formatPrice((item.product.discount_price || item.product.price) * item.quantity)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Order Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="note" size={24} color="#40E0D0" />
            <Text style={styles.sectionTitle}>ملاحظات الطلب (اختياري)</Text>
          </View>
          
          <TextInput
            style={styles.notesInput}
            placeholder="أضف أي ملاحظات خاصة بالطلب..."
            placeholderTextColor="#999"
            value={orderNotes}
            onChangeText={setOrderNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="receipt" size={24} color="#40E0D0" />
            <Text style={styles.sectionTitle}>ملخص الطلب</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>المجموع الفرعي:</Text>
            <Text style={styles.summaryValue}>{formatPrice(getSubtotal())}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>عدد العناصر:</Text>
            <Text style={styles.summaryValue}>
              {cartItems.reduce((total, item) => total + item.quantity, 0)} عنصر
            </Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>المجموع الإجمالي:</Text>
            <Text style={styles.totalValue}>{formatPrice(getSubtotal())}</Text>
          </View>
        </View>

        {/* Order Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="info" size={24} color="#40E0D0" />
            <Text style={styles.sectionTitle}>معلومات مهمة</Text>
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <MaterialIcons name="schedule" size={20} color="#28A745" />
              <Text style={styles.infoText}>
                سيتم التواصل معك خلال 24 ساعة لتأكيد الطلب
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="local-shipping" size={20} color="#28A745" />
              <Text style={styles.infoText}>
                سيتم ترتيب التوصيل حسب موقع المحل
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="payment" size={20} color="#28A745" />
              <Text style={styles.infoText}>
                الدفع عند الاستلام أو حسب الاتفاق
              </Text>
            </View>
          </View>
        </View>
        
        {/* Place Order Button - Inside Page Content */}
        <View style={styles.placeOrderButtonContainer}>
          <TouchableOpacity
            style={styles.placeOrderButton}
            onPress={handlePlaceOrder}
            disabled={placing || cartItems.length === 0}
          >
            <MaterialIcons name="shopping-cart-checkout" size={32} color="#fff" />
            <Text style={styles.placeOrderText}>
              {placing ? 'جاري إنشاء الطلب...' : 'إتمام الطلب'}
            </Text>
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
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
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
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#40E0D0',
  },
  notesInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#40E0D0',
  },
  infoContainer: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  placeOrderButtonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  placeOrderButton: {
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
  placeOrderText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  bottomSpacing: {
    height: 100, // Adjust as needed for spacing
  },
}); 