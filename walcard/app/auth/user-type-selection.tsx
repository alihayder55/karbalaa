import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

export default function UserTypeSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = params.phone as string;
  const fullName = params.fullName as string;
  const [loading, setLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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
  }, []);

  const handleUserTypeSelection = async (userType: 'merchant' | 'store_owner') => {
    if (!phone || !fullName) {
      Alert.alert('خطأ', 'معلومات غير مكتملة');
      return;
    }

    // توجيه المستخدم لصفحة التسجيل المناسبة
    if (userType === 'merchant') {
      router.push({
        pathname: '/auth/merchant-registration',
        params: { 
          phone: phone,
          fullName: fullName
        }
      });
    } else {
      router.push({
        pathname: '/auth/store-owner-registration',
        params: { 
          phone: phone,
          fullName: fullName
        }
      });
    }
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
                  <View style={styles.avatarContainer}>
                    <MaterialIcons name="account-circle" size={80} color="#007AFF" />
                    <View style={styles.statusIndicator}>
                      <MaterialIcons name="check-circle" size={24} color="#28a745" />
                    </View>
                  </View>
                  <Text style={styles.welcomeTitle}>مرحباً بك في ولكارد</Text>
                  <Text style={styles.userName}>{fullName}</Text>
                  <Text style={styles.welcomeSubtitle}>
                    اختر نوع الحساب المناسب لك
                  </Text>
                </View>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.sectionTitle}>
                  <MaterialIcons name="business" size={24} color="#007AFF" />
                  <Text style={styles.sectionTitleText}>نوع الحساب</Text>
                </View>

                <View style={styles.userTypeOptions}>
                  <TouchableOpacity
                    style={styles.userTypeOption}
                    onPress={() => handleUserTypeSelection('merchant')}
                  >
                    <View style={styles.userTypeIconContainer}>
                      <MaterialIcons name="business" size={48} color="#007AFF" />
                    </View>
                    <Text style={styles.userTypeTitle}>تاجر</Text>
                    <Text style={styles.userTypeDescription}>
                      بيع المنتجات بالجملة للمحلات والموزعين
                    </Text>
                    <View style={styles.userTypeFeatures}>
                      <View style={styles.featureItem}>
                        <MaterialIcons name="check" size={16} color="#28a745" />
                        <Text style={styles.featureText}>إدارة المخزون</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MaterialIcons name="check" size={16} color="#28a745" />
                        <Text style={styles.featureText}>طلبات الجملة</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MaterialIcons name="check" size={16} color="#28a745" />
                        <Text style={styles.featureText}>تقارير المبيعات</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.userTypeOption}
                    onPress={() => handleUserTypeSelection('store_owner')}
                  >
                    <View style={styles.userTypeIconContainer}>
                      <MaterialIcons name="store" size={48} color="#007AFF" />
                    </View>
                    <Text style={styles.userTypeTitle}>صاحب محل</Text>
                    <Text style={styles.userTypeDescription}>
                      شراء المنتجات من التجار بالجملة
                    </Text>
                    <View style={styles.userTypeFeatures}>
                      <View style={styles.featureItem}>
                        <MaterialIcons name="check" size={16} color="#28a745" />
                        <Text style={styles.featureText}>تصفح المنتجات</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MaterialIcons name="check" size={16} color="#28a745" />
                        <Text style={styles.featureText}>طلبات الجملة</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MaterialIcons name="check" size={16} color="#28a745" />
                        <Text style={styles.featureText}>تتبع الطلبات</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                  <MaterialIcons name="info" size={20} color="#007AFF" />
                  <Text style={styles.infoText}>
                    اختر نوع الحساب المناسب لك لإكمال عملية التسجيل
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                  disabled={loading}
                >
                  <MaterialIcons name="arrow-back" size={20} color="#666" />
                  <Text style={styles.backButtonText}>العودة</Text>
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
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
  userTypeOptions: {
    gap: 16,
    marginBottom: 24,
  },
  userTypeOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  userTypeOptionDisabled: {
    opacity: 0.6,
  },
  userTypeIconContainer: {
    marginBottom: 16,
  },
  userTypeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  userTypeDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  userTypeFeatures: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
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