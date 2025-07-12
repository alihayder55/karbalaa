import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>جاري تحميل الطلب...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إتمام الطلب</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="shopping-cart" size={24} color="#FF6B35" />
            <Text style={styles.sectionTitle}>عناصر الطلب</Text>
          </View>
          
          {cartItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.itemImageContainer}>
                {item.product?.image_url ? (
                  <Image source={{ uri: item.product.image_url }} style={styles.itemImage} />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <MaterialIcons name="image" size={24} color="#ccc" />
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
            <MaterialIcons name="note" size={24} color="#FF6B35" />
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
            <MaterialIcons name="receipt" size={24} color="#FF6B35" />
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
            <MaterialIcons name="info" size={24} color="#FF6B35" />
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
                الدفع عند الاستلام أو حسب اتفاق مع التاجر
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={handlePlaceOrder}
          disabled={placing}
        >
          {placing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="check-circle" size={24} color="#fff" />
              <Text style={styles.placeOrderText}>تأكيد الطلب</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
    minHeight: 100,
    textAlign: 'right',
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
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  infoContainer: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  placeOrderButton: {
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
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 