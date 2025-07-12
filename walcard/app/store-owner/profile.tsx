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
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { logoutUser } from '../../lib/auth-helpers';
import { getCurrentUser } from '../../lib/auth-helpers';

interface StoreOwner {
  user_id: string;
  store_name: string;
  store_type: string;
  business_type: string;
  address: string;
  city: string;
  district: string;
  nearest_landmark: string;
  working_days: string[];
  opening_time: string;
  closing_time: string;
  storefront_image?: string;
  wants_ads: boolean;
  offers_daily_deals: boolean;
  is_approved: boolean;
}

interface User {
  id: string;
  full_name: string;
  phone_number: string;
  user_type: string;
  avatar_url?: string;
  is_approved: boolean;
}

export default function StoreOwnerProfile() {
  const router = useRouter();
  const [storeOwner, setStoreOwner] = useState<StoreOwner | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Use session manager instead of supabase auth
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log('❌ No user session found, redirecting to login');
        router.replace('/onboarding/welcome');
        return;
      }

      console.log('✅ Loading profile data for user:', currentUser.user_id);

      // Load user data from session
      setUser({
        id: currentUser.user_id,
        full_name: currentUser.full_name,
        phone_number: currentUser.phone_number,
        user_type: currentUser.user_type,
        is_approved: currentUser.is_approved,
        created_at: new Date().toISOString(), // We don't have this in session
        updated_at: new Date().toISOString(), // We don't have this in session
      });

      // Load store owner data
      const { data: storeData, error: storeError } = await supabase
        .from('store_owners')
        .select('*')
        .eq('user_id', currentUser.user_id)
        .single();

      if (storeError) {
        console.error('Error loading store owner data:', storeError);
        if (storeError.code === 'PGRST116') {
          console.log('❌ Store owner record not found');
          Alert.alert(
            'خطأ',
            'لم يتم العثور على بيانات المحل. يرجى التحقق من نوع الحساب.',
            [
              {
                text: 'موافق',
                onPress: () => router.replace('/onboarding/welcome')
              }
            ]
          );
        }
        return;
      }
      
      setStoreOwner(storeData);
      console.log('✅ Profile data loaded successfully');
    } catch (error) {
      console.error('Error loading profile data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear session using our session manager
              await logoutUser();
              
              console.log('✅ Logout successful');
              router.replace('/onboarding/welcome');
            } catch (error) {
              console.error('💥 Error during logout:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الخروج');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // يمكن إضافة صفحة تعديل الملف الشخصي هنا
    Alert.alert('قريباً', 'سيتم إضافة هذه الميزة قريباً');
  };

  const handleSettings = () => {
    // يمكن إضافة صفحة الإعدادات هنا
    Alert.alert('قريباً', 'سيتم إضافة هذه الميزة قريباً');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>الملف الشخصي</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {storeOwner?.storefront_image ? (
              <Image
                source={{ uri: storeOwner.storefront_image }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <MaterialIcons name="store" size={60} color="#ccc" />
              </View>
            )}
            <View style={styles.approvalBadge}>
              <MaterialIcons
                name={storeOwner?.is_approved ? "check-circle" : "pending"}
                size={20}
                color={storeOwner?.is_approved ? "#28A745" : "#FFA500"}
              />
              <Text style={[
                styles.approvalText,
                { color: storeOwner?.is_approved ? "#28A745" : "#FFA500" }
              ]}>
                {storeOwner?.is_approved ? "موافق عليه" : "قيد المراجعة"}
              </Text>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.storeName}>{storeOwner?.store_name}</Text>
            <Text style={styles.storeType}>{storeOwner?.business_type}</Text>
            <Text style={styles.ownerName}>{user?.full_name}</Text>
          </View>
        </View>

        {/* Store Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="store" size={24} color="#FF6B35" />
            <Text style={styles.sectionTitle}>معلومات المتجر</Text>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>العنوان</Text>
                <Text style={styles.infoValue}>
                  {storeOwner?.address}, {storeOwner?.city}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="place" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>المنطقة</Text>
                <Text style={styles.infoValue}>{storeOwner?.district}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="landscape" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>أقرب معلم</Text>
                <Text style={styles.infoValue}>{storeOwner?.nearest_landmark}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>ساعات العمل</Text>
                <Text style={styles.infoValue}>
                  {storeOwner?.opening_time} - {storeOwner?.closing_time}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="event" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>أيام العمل</Text>
                <Text style={styles.infoValue}>
                  {storeOwner?.working_days ? storeOwner.working_days.join('، ') : 'غير محدد'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="calendar-today" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>تاريخ التسجيل</Text>
                <Text style={styles.infoValue}>
                  تم التسجيل حديثاً
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="contact-phone" size={24} color="#FF6B35" />
            <Text style={styles.sectionTitle}>معلومات الاتصال</Text>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>رقم الهاتف</Text>
                <Text style={styles.infoValue}>{user?.phone_number}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="chat" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>رقم الواتساب</Text>
                <Text style={styles.infoValue}>
                  غير محدد
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="settings" size={24} color="#FF6B35" />
            <Text style={styles.sectionTitle}>التفضيلات</Text>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <MaterialIcons name="campaign" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>الإعلانات</Text>
                <Text style={styles.infoValue}>
                  {storeOwner?.wants_ads ? 'مفعلة' : 'معطلة'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="local-offer" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>العروض اليومية</Text>
                <Text style={styles.infoValue}>
                  {storeOwner?.offers_daily_deals ? 'متوفرة' : 'غير متوفرة'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="build" size={24} color="#FF6B35" />
            <Text style={styles.sectionTitle}>الإعدادات</Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
              <MaterialIcons name="edit" size={20} color="#FF6B35" />
              <Text style={styles.actionText}>تعديل الملف الشخصي</Text>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleSettings}>
              <MaterialIcons name="settings" size={20} color="#FF6B35" />
              <Text style={styles.actionText}>الإعدادات</Text>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color="#DC3545" />
              <Text style={[styles.actionText, { color: '#DC3545' }]}>تسجيل الخروج</Text>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  approvalBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  approvalText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  profileInfo: {
    alignItems: 'center',
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  storeType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  ownerName: {
    fontSize: 18,
    color: '#FF6B35',
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
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
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  actionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
}); 