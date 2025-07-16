import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../lib/auth-helpers';

interface Order {
  id: string;
  status: string;
  total_price: number;
  delivery_address?: string;
  delivery_notes?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_order: number;
  product: {
    name: string;
    image_url?: string;
  };
}

const ORDER_STATUSES = {
  pending: { label: 'في الانتظار', color: '#ff9800', icon: 'schedule' },
  confirmed: { label: 'مؤكد', color: '#40E0D0', icon: 'check-circle' },
  preparing: { label: 'قيد التحضير', color: '#1ABC9C', icon: 'restaurant' },
  shipped: { label: 'تم الشحن', color: '#28A745', icon: 'local-shipping' },
  delivered: { label: 'تم التوصيل', color: '#28A745', icon: 'done' },
  cancelled: { label: 'ملغي', color: '#ff4757', icon: 'cancel' },
};

export default function StoreOwnerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Use session manager instead of supabase auth
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log('❌ No user session found, redirecting to login');
        router.replace('/onboarding/welcome');
        return;
      }

      console.log('✅ Loading orders for user:', currentUser.user_id);

      // Get orders for this store owner
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_price,
          created_at,
          updated_at
        `)
        .eq('store_owner_id', currentUser.user_id);

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
        throw ordersError;
      }

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              id,
              product_id,
              quantity,
              price_at_order,
              products (
                name,
                image_url
              )
            `)
            .eq('order_id', order.id);

          if (itemsError) throw itemsError;

          return {
            ...order,
            order_items: (itemsData || []).map(item => ({
              id: item.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price_at_order: item.price_at_order,
              product: {
                name: item.products?.[0]?.name || '',
                image_url: item.products?.[0]?.image_url,
              }
            })),
          };
        })
      );

      setOrders(ordersWithItems);
      console.log('✅ Orders loaded successfully:', ordersWithItems.length);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleOrderPress = (order: Order) => {
    router.push({
      pathname: '/store-owner/order-details',
      params: { orderId: order.id }
    });
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

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#40E0D0" />
          <Text style={styles.loadingText}>جاري تحميل الطلبات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>الطلبات</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedStatus === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedStatus('all')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedStatus === 'all' && styles.filterButtonTextActive
            ]}>
              الكل ({orders.length})
            </Text>
          </TouchableOpacity>
          
          {Object.entries(ORDER_STATUSES).map(([status, info]) => {
            const count = orders.filter(order => order.status === status).length;
            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  selectedStatus === status && styles.filterButtonActive
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedStatus === status && styles.filterButtonTextActive
                ]}>
                  {info.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
            <Text style={styles.emptyText}>
              {selectedStatus === 'all' 
                ? 'لم يتم العثور على أي طلبات بعد'
                : `لا توجد طلبات بحالة "${getStatusInfo(selectedStatus).label}"`
              }
            </Text>
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => handleOrderPress(order)}
                >
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderNumber}>طلب #{order.id.slice(-8)}</Text>
                      <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                      <MaterialIcons name={statusInfo.icon as any} size={16} color="#fff" />
                      <Text style={styles.statusText}>{statusInfo.label}</Text>
                    </View>
                  </View>

                  <View style={styles.orderItems}>
                    {order.order_items.slice(0, 2).map((item) => (
                      <View key={item.id} style={styles.orderItem}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.product.name}
                        </Text>
                        <Text style={styles.itemQuantity}>
                          الكمية: {item.quantity}
                        </Text>
                      </View>
                    ))}
                    {order.order_items.length > 2 && (
                      <Text style={styles.moreItems}>
                        +{order.order_items.length - 2} منتجات أخرى
                      </Text>
                    )}
                  </View>

                  <View style={styles.orderFooter}>
                    <Text style={styles.totalPrice}>
                      {formatPrice(order.total_price)}
                    </Text>
                    <TouchableOpacity style={styles.detailsButton}>
                      <Text style={styles.detailsButtonText}>عرض التفاصيل</Text>
                      <MaterialIcons name="arrow-forward-ios" size={16} color="#40E0D0" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
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
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 4, // Add some padding
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 4, // Reduced padding
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6, // Slightly reduced
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    // Updated to match home page design
  },
  filterButtonActive: {
    backgroundColor: '#40E0D0',
    borderColor: '#40E0D0',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  ordersContainer: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  moreItems: {
    fontSize: 12,
    color: '#40E0D0',
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#40E0D0',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#40E0D0',
  },
  bottomSpacing: {
    height: 120,
  },
  headerSpacer: {
    width: 40, // Adjust as needed to balance the title and back button
  },
}); 