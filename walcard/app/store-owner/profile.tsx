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
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    router.push('/store-owner/(modals)/edit-profile');
  };

  const handleHelp = () => {
    router.push('/store-owner/(modals)/help');
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#40E0D0" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>الملف الشخصي</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
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
                <MaterialIcons name="store" size={60} color="#40E0D0" />
              </View>
            )}
            <View style={styles.approvalBadge}>
              <MaterialIcons
                name={user?.is_approved ? "check-circle" : "pending"}
                size={20}
                color={user?.is_approved ? "#28A745" : "#FFA500"}
              />
              <Text style={[
                styles.approvalText,
                { color: user?.is_approved ? "#28A745" : "#FFA500" }
              ]}>
                {user?.is_approved ? "موافق عليه" : "قيد المراجعة"}
              </Text>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.storeName}>{storeOwner?.store_name}</Text>
            <Text style={styles.storeType}>{storeOwner?.business_type}</Text>
            <Text style={styles.ownerName}>{user?.full_name}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="flash-on" size={24} color="#40E0D0" />
            <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionCard} onPress={handleEditProfile}>
              <MaterialIcons name="edit" size={32} color="#40E0D0" />
              <Text style={styles.actionText}>تعديل الملف</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={handleHelp}>
              <MaterialIcons name="help" size={32} color="#40E0D0" />
              <Text style={styles.actionText}>المساعدة</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Store Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="store" size={24} color="#40E0D0" />
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
                  {storeOwner?.working_days?.join(', ')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* User Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={24} color="#40E0D0" />
            <Text style={styles.sectionTitle}>معلومات المستخدم</Text>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>الاسم الكامل</Text>
                <Text style={styles.infoValue}>{user?.full_name}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>رقم الهاتف</Text>
                <Text style={styles.infoValue}>{user?.phone_number}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="account-circle" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>نوع الحساب</Text>
                <Text style={styles.infoValue}>
                  {user?.user_type === 'store_owner' ? 'صاحب محل' : 'تاجر'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#fff" />
            <Text style={styles.logoutText}>تسجيل الخروج</Text>
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
  settingsButton: {
    padding: 8,
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
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  profileCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
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
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  approvalText: {
    fontSize: 14,
    fontWeight: '600',
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
    color: '#40E0D0',
    fontWeight: '600',
    marginBottom: 8,
  },
  ownerName: {
    fontSize: 18,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 120,
  },
}); 