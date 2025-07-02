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
  Platform,
  KeyboardAvoidingView,
  Animated,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const SUPPORT_PHONE = '+9647810277890';
const { width, height } = Dimensions.get('window');

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { userType, fullName } = useLocalSearchParams();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
  }, []);

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

  const getUserTypeIcon = () => {
    return userType === 'merchant' ? 'business' : 'store';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              <View style={styles.header}>
                <View style={styles.welcomeContainer}>
                  <Animated.View 
                    style={[
                      styles.avatarContainer,
                      {
                        transform: [{ scale: pulseAnim }]
                      }
                    ]}
                  >
                    <MaterialIcons name="pending" size={80} color="#ff9800" />
                    <View style={styles.statusIndicator}>
                      <MaterialIcons name="schedule" size={24} color="#ff9800" />
                    </View>
                  </Animated.View>
                  <Text style={styles.welcomeTitle}>مرحباً بك في ولكارد</Text>
                  <Text style={styles.userName}>{fullName}</Text>
                  <View style={styles.userTypeBadge}>
                    <MaterialIcons 
                      name={getUserTypeIcon()} 
                      size={16} 
                      color="#007AFF" 
                    />
                    <Text style={styles.userType}>
                      {getUserTypeText()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.sectionTitle}>
                  <MaterialIcons name="schedule" size={24} color="#ff9800" />
                  <Text style={styles.sectionTitleText}>حسابك قيد المراجعة</Text>
                </View>

                <View style={styles.statusContainer}>
                  <View style={styles.statusIconContainer}>
                    <MaterialIcons name="pending-actions" size={48} color="#ff9800" />
                  </View>
                  <Text style={styles.statusTitle}>في انتظار الموافقة</Text>
                  <Text style={styles.statusDescription}>
                    فريق ولكارد يراجع طلبك حالياً. هذه العملية تستغرق عادةً 24-48 ساعة.
                  </Text>
                </View>

                <View style={styles.processSteps}>
                  <View style={styles.stepItem}>
                    <View style={styles.stepIcon}>
                      <MaterialIcons name="check-circle" size={24} color="#28a745" />
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>تم إنشاء الحساب</Text>
                      <Text style={styles.stepDescription}>
                        تم إنشاء حسابك بنجاح وإرسال البيانات للمراجعة
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stepItem}>
                    <View style={[styles.stepIcon, styles.stepIconPending]}>
                      <MaterialIcons name="schedule" size={24} color="#ff9800" />
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>قيد المراجعة</Text>
                      <Text style={styles.stepDescription}>
                        فريق ولكارد يراجع معلوماتك للتأكد من صحتها
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stepItem}>
                    <View style={[styles.stepIcon, styles.stepIconFuture]}>
                      <MaterialIcons name="verified" size={24} color="#ccc" />
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepTitle, styles.stepTitleFuture]}>الموافقة</Text>
                      <Text style={[styles.stepDescription, styles.stepDescriptionFuture]}>
                        بعد الموافقة ستتمكن من الوصول لجميع الميزات
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <MaterialIcons name="info" size={20} color="#007AFF" />
                  <Text style={styles.infoText}>
                    ستتلقى إشعاراً عبر الهاتف عند الموافقة على حسابك
                  </Text>
                </View>

                <View style={styles.infoBox}>
                  <MaterialIcons name="support-agent" size={20} color="#28a745" />
                  <Text style={styles.infoText}>
                    للاستفسار حول حالة طلبك، تواصل مع فريق الدعم
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleContactSupport}
                >
                  <MaterialIcons name="support-agent" size={20} color="#fff" />
                  <Text style={styles.contactButtonText}>تواصل مع الدعم</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleLogout}
                >
                  <MaterialIcons name="logout" size={20} color="#dc3545" />
                  <Text style={styles.backButtonText}>تسجيل خروج</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  userTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  userType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusIconContainer: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff9800',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  processSteps: {
    marginBottom: 32,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepIconPending: {
    backgroundColor: '#fff3e0',
  },
  stepIconFuture: {
    backgroundColor: '#f5f5f5',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  stepTitleFuture: {
    color: '#999',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  stepDescriptionFuture: {
    color: '#999',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
}); 