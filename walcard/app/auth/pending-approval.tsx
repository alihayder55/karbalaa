import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Linking,
  AppState,
  SafeAreaView,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const SUPPORT_PHONE = '+9647810277890';

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { userType, fullName } = useLocalSearchParams();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // فحص حالة الموافقة كل دقيقة
  const checkApprovalStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // التحقق من حالة الموافقة في الجدول المناسب
      if (userType === 'merchant') {
        const { data, error } = await supabase
          .from('merchants')
          .select('is_approved')
          .eq('user_id', user.id)
          .single();

        if (!error && data?.is_approved) {
          Alert.alert(
            'تم الموافقة على حسابك!',
            'مرحباً بك في ولكارد. يمكنك الآن استخدام جميع مميزات التطبيق.',
            [
              {
                text: 'متابعة',
                onPress: () => router.replace('/(tabs)')
              }
            ]
          );
        }
      } else if (userType === 'store_owner') {
        const { data, error } = await supabase
          .from('store_owners')
          .select('is_approved')
          .eq('user_id', user.id)
          .single();

        if (!error && data?.is_approved) {
          Alert.alert(
            'تم الموافقة على حسابك!',
            'مرحباً بك في ولكارد. يمكنك الآن استخدام جميع مميزات التطبيق.',
            [
              {
                text: 'متابعة',
                onPress: () => router.replace('/(tabs)')
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
    }
  };

  useEffect(() => {
    // فحص فوري عند تحميل الصفحة
    checkApprovalStatus();

    // إعداد فحص دوري كل دقيقة
    intervalRef.current = setInterval(checkApprovalStatus, 60000);

    // فحص عند العودة للتطبيق
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        checkApprovalStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // تنظيف عند مغادرة الصفحة
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription?.remove();
    };
  }, [userType, router]);

  const handleContactSupport = () => {
    Alert.alert(
      'تواصل مع الدعم',
      `هل تريد الاتصال بفريق الدعم على الرقم ${SUPPORT_PHONE}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'اتصال',
          onPress: () => {
            Linking.openURL(`tel:${SUPPORT_PHONE}`);
          }
        },
        {
          text: 'واتساب',
          onPress: () => {
            const whatsappUrl = `whatsapp://send?phone=${SUPPORT_PHONE.replace('+', '')}&text=مرحباً، أحتاج مساعدة بخصوص طلب التسجيل في ولكارد`;
            Linking.openURL(whatsappUrl).catch(() => {
              Alert.alert('خطأ', 'تطبيق واتساب غير مثبت على الجهاز');
            });
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'تسجيل خروج',
          style: 'destructive',
          onPress: () => {
            router.replace('/auth/unified-auth');
          }
        }
      ]
    );
  };

  const getUserTypeText = () => {
    return userType === 'merchant' ? 'تاجر' : 'صاحب محل';
  };

  const getIconName = () => {
    return userType === 'merchant' ? 'business' : 'store';
  };

  const getIconColor = () => {
    return userType === 'merchant' ? '#007AFF' : '#FF6B35';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '20' }]}>
              <MaterialIcons name={getIconName()} size={64} color={getIconColor()} />
            </View>
            <Text style={styles.title}>طلبك قيد المراجعة</Text>
            <Text style={styles.subtitle}>
              مرحباً {fullName}، تم استلام طلب التسجيل كـ {getUserTypeText()}
            </Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <MaterialIcons name="schedule" size={32} color="#FF9500" />
              <Text style={styles.statusTitle}>حالة الطلب</Text>
            </View>
            <Text style={styles.statusText}>
              طلبك قيد المراجعة من قبل فريقنا المختص
            </Text>
            <View style={styles.timelineContainer}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineIcon, styles.completed]}>
                  <MaterialIcons name="check" size={16} color="#fff" />
                </View>
                <Text style={styles.timelineText}>تم إرسال الطلب</Text>
              </View>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineIcon, styles.current]}>
                  <MaterialIcons name="schedule" size={16} color="#fff" />
                </View>
                <Text style={styles.timelineText}>قيد المراجعة</Text>
              </View>
              <View style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <MaterialIcons name="check-circle" size={16} color="#ccc" />
                </View>
                <Text style={[styles.timelineText, styles.pending]}>الموافقة</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <MaterialIcons name="info" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>وقت المراجعة المتوقع</Text>
              <Text style={styles.infoText}>
                يتم مراجعة الطلبات خلال 24-48 ساعة من تاريخ الإرسال. 
                ستتلقى إشعاراً فور الموافقة على حسابك.
              </Text>
            </View>
          </View>

          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>متطلبات الموافقة:</Text>
            {userType === 'merchant' ? (
              <View style={styles.requirementsList}>
                <View style={styles.requirementItem}>
                  <MaterialIcons name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.requirementText}>معلومات النشاط التجاري صحيحة</Text>
                </View>
                <View style={styles.requirementItem}>
                  <MaterialIcons name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.requirementText}>رقم الهاتف مفعل</Text>
                </View>
                <View style={styles.requirementItem}>
                  <MaterialIcons name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.requirementText}>تحديد المنتجات المتاحة</Text>
                </View>
              </View>
            ) : (
              <View style={styles.requirementsList}>
                <View style={styles.requirementItem}>
                  <MaterialIcons name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.requirementText}>معلومات المحل صحيحة</Text>
                </View>
                <View style={styles.requirementItem}>
                  <MaterialIcons name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.requirementText}>رقم الهاتف مفعل</Text>
                </View>
                <View style={styles.requirementItem}>
                  <MaterialIcons name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.requirementText}>تحديد نوع المحل</Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleContactSupport}
          >
            <MaterialIcons name="support-agent" size={24} color="#fff" />
            <Text style={styles.supportButtonText}>تواصل مع الدعم</Text>
          </TouchableOpacity>

          <View style={styles.supportInfo}>
            <MaterialIcons name="phone" size={20} color="#666" />
            <Text style={styles.supportText}>
              أرقام الدعم: {SUPPORT_PHONE}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color="#dc3545" />
            <Text style={styles.logoutButtonText}>تسجيل خروج</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  statusCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  timelineContainer: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completed: {
    backgroundColor: '#28a745',
  },
  current: {
    backgroundColor: '#FF9500',
  },
  timelineText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  pending: {
    color: '#999',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
  },
  requirementsCard: {
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 12,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#155724',
  },
  supportButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  supportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 30,
  },
  supportText: {
    fontSize: 14,
    color: '#666',
    direction: 'ltr',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '500',
  },
}); 