import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';

const { width } = Dimensions.get('window');

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_order: number;
  product: {
    name: string;
    image_url?: string;
    description?: string;
  } | null;
}

interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  updated_at: string;
  store_owner_id?: string;
  store_owners?: {
    store_name: string;
    address: string;
    nearest_landmark: string;
  } | null;
  order_items: OrderItem[];
}

const ORDER_STATUSES = {
  pending: { label: 'في الانتظار', color: '#ff9800', icon: 'schedule' as const, bgColor: '#fff3e0' },
  confirmed: { label: 'مؤكد', color: '#40E0D0', icon: 'check-circle' as const, bgColor: '#e0f7fa' },
  preparing: { label: 'قيد التحضير', color: '#1ABC9C', icon: 'restaurant' as const, bgColor: '#e8f5e8' },
  shipped: { label: 'تم الشحن', color: '#28A745', icon: 'local-shipping' as const, bgColor: '#e8f5e8' },
  delivered: { label: 'تم التوصيل', color: '#28A745', icon: 'done' as const, bgColor: '#e8f5e8' },
  cancelled: { label: 'ملغي', color: '#ff4757', icon: 'cancel' as const, bgColor: '#ffebee' },
};

export default function StoreOwnerOrderDetails() {
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading order details for:', orderId);

      // Get order details with store owner info
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_price,
          created_at,
          updated_at,
          store_owner_id,
          store_owners (
            store_name,
            address,
            nearest_landmark
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('Error loading order:', orderError);
        Alert.alert('خطأ', 'حدث خطأ أثناء تحميل تفاصيل الطلب');
        return;
      }

      // Get order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          product_id,
          quantity,
          price_at_order
        `)
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error loading order items:', itemsError);
        throw itemsError;
      }

      // Get products for each order item
      const orderItemsWithProducts = await Promise.all(
        (itemsData || []).map(async (item) => {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('name, image_url, description')
            .eq('id', item.product_id)
            .single();

          if (productError) {
            console.error('Error loading product:', productError);
            return {
              id: item.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price_at_order: item.price_at_order,
              product: {
                name: 'منتج غير متوفر',
                image_url: null,
                description: 'لا يوجد وصف'
              }
            };
          }

          return {
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_order: item.price_at_order,
            product: {
              name: productData?.name || 'منتج غير متوفر',
              image_url: productData?.image_url,
              description: productData?.description || 'لا يوجد وصف'
            }
          };
        })
      );

      const orderWithItems = {
        ...orderData,
        store_owners: orderData.store_owners?.[0] || null,
        order_items: orderItemsWithProducts,
      };

      console.log('📊 Order data loaded:', {
        id: orderData.id,
        store_name: orderData.store_owners?.[0]?.store_name,
        address: orderData.store_owners?.[0]?.address,
        nearest_landmark: orderData.store_owners?.[0]?.nearest_landmark
      });

      setOrder(orderWithItems);
      console.log('✅ Order details loaded successfully');
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل تفاصيل الطلب');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    return ORDER_STATUSES[status as keyof typeof ORDER_STATUSES] || ORDER_STATUSES.pending;
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} د.ع`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Removed handleUpdateStatus function - store owners should not update order status

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#40E0D0" />
          <Text style={styles.loadingText}>جاري تحميل تفاصيل الطلب...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={80} color="#ccc" />
          <Text style={styles.errorTitle}>لم يتم العثور على الطلب</Text>
          <Text style={styles.errorText}>الطلب المطلوب غير موجود أو تم حذفه</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/store-owner')}>
          <MaterialIcons name="arrow-back" size={24} color="#40E0D0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="print" size={20} color="#40E0D0" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <MaterialIcons name={statusInfo.icon} size={24} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
          <Text style={styles.orderNumber}>طلب رقم: #{order.id.slice(-8)}</Text>
          <Text style={styles.orderDate}>
            {formatDate(order.created_at)}
          </Text>
        </View>
        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="inventory" size={20} color="#40E0D0" />
            <Text style={styles.sectionTitle}>المنتجات المطلوبة</Text>
          </View>
          <View style={styles.itemsContainer}>
            {order.order_items.map((item, index) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemImageContainer}>
                  {item.product ? (
                    <Image
                      source={{ uri: item.product.image_url }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <MaterialIcons name="inventory" size={24} color="#666" />
                    </View>
                  )}
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product?.name || 'لا يوجد اسم'}
                  </Text>
                  <Text style={styles.itemDescription} numberOfLines={1}>
                    {item.product?.description || 'لا يوجد وصف'}
                  </Text>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemQuantity}>
                      الكمية: {item.quantity}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {formatPrice(item.price_at_order)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="receipt" size={20} color="#40E0D0" />
            <Text style={styles.sectionTitle}>ملخص الطلب</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>عدد المنتجات:</Text>
              <Text style={styles.summaryValue}>{order.order_items.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>إجمالي الكمية:</Text>
              <Text style={styles.summaryValue}>
                {order.order_items.reduce((sum, item) => sum + item.quantity, 0)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>المجموع الكلي:</Text>
              <Text style={styles.totalValue}>{formatPrice(order.total_price)}</Text>
            </View>
          </View>
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
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
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
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#40E0D0',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  customerInfo: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
    marginLeft: 8,
  },
  itemsContainer: {
    padding: 20,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
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
    backgroundColor: '#e0e0e0',
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
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
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
    fontWeight: '600',
    color: '#40E0D0',
  },
  summaryCard: {
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#40E0D0',
  },
  notesCard: {
    padding: 20,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  infoCard: {
    padding: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 120,
  },
}); 