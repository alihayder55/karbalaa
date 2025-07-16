import React, { useState, useEffect, useRef } from 'react';
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
  TextInput,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { checkNetworkConnectivity } from '../../lib/test-connection';
import { loginUser } from '../../lib/auth-helpers';

const { width, height } = Dimensions.get('window');

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = params.phone as string;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpInputError, setOtpInputError] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

    // Start countdown for resend
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    // تحسين التحقق من الرمز
    const cleanOtp = otp.replace(/\s/g, ''); // إزالة المسافات
    
    if (!cleanOtp || cleanOtp.length !== 6) {
      Alert.alert('خطأ', 'الرجاء إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    // التحقق من أن الرمز يحتوي على أرقام فقط
    if (!/^\d{6}$/.test(cleanOtp)) {
      Alert.alert('خطأ', 'رمز التحقق يجب أن يحتوي على أرقام فقط');
      return;
    }

    try {
      setLoading(true);
      console.log('🔐 Verifying OTP:', { phone, otp: cleanOtp, isRegistration: params.isRegistration });

      // Try WhatsApp verification first
      let { data, error } = await supabase.auth.verifyOtp({
        phone: phone as string,
        token: cleanOtp,
        type: 'sms'
      });

      // If WhatsApp verification fails, try SMS
      if (error && (error.message?.includes('Invalid') || error.message?.includes('whatsapp'))) {
        console.log('WhatsApp verification failed, trying SMS...');
        const smsResult = await supabase.auth.verifyOtp({
          phone: phone as string,
          token: cleanOtp,
          type: 'sms'
        });
        data = smsResult.data;
        error = smsResult.error;
      }

      console.log('📱 OTP verification response:', { 
        hasData: !!data, 
        hasError: !!error,
        errorMessage: error?.message,
        errorStatus: error?.status
      });

      if (error) {
        console.error('❌ OTP verification error:', error);
        throw error;
      }

      console.log('✅ OTP verified successfully');
      
      // Check if this is a registration flow
      if (params.isRegistration === 'true') {
        // For new users, redirect to user type selection
        Alert.alert(
          'نجاح', 
          'تم التحقق من الرمز بنجاح، اختر نوع المستخدم',
          [
            {
              text: 'متابعة',
              onPress: () => router.replace({
                pathname: '/auth/user-type-selection',
                params: { 
                  phone: phone,
                  fullName: params.name as string
                }
              })
            }
          ]
        );
      } else {
        // For existing users, create session and redirect
        console.log('🔍 Creating session for existing user:', phone);
        
        // Use the loginUser function to create a proper session
        const loginResult = await loginUser(phone);
        
        if (loginResult.success && loginResult.session) {
          console.log('✅ Session created successfully for user:', loginResult.session.user_type);
          
          // Redirect based on user type
          if (loginResult.session.user_type === 'store_owner') {
            Alert.alert(
              'نجاح', 
              'تم تسجيل الدخول بنجاح',
              [
                {
                  text: 'متابعة',
                  onPress: () => router.replace('/store-owner')
                }
              ]
            );
          } else if (loginResult.session.user_type === 'merchant') {
            Alert.alert(
              'نجاح', 
              'تم تسجيل الدخول بنجاح',
              [
                {
                  text: 'متابعة',
                  onPress: () => router.replace('/(tabs)')
                }
              ]
            );
          } else {
            // Admin or other user types
            Alert.alert(
              'نجاح', 
              'تم تسجيل الدخول بنجاح',
              [
                {
                  text: 'متابعة',
                  onPress: () => router.replace('/(tabs)')
                }
              ]
            );
          }
        } else if (loginResult.needsApproval) {
          // User account not approved
          Alert.alert(
            'حساب قيد المراجعة',
            'تم تسجيل الدخول بنجاح، لكن حسابك قيد المراجعة. سيتم إشعارك عند الموافقة عليه.',
            [
              {
                text: 'موافق',
                onPress: () => router.replace('/auth/pending-approval')
              }
            ]
          );
        } else {
          // Login failed
          console.error('❌ Login failed:', loginResult.error);
          Alert.alert(
            'خطأ',
            loginResult.error || 'حدث خطأ أثناء تسجيل الدخول',
            [
              {
                text: 'موافق',
                onPress: () => router.replace('/onboarding/welcome')
              }
            ]
          );
        }
      }
    } catch (error: any) {
      console.error('💥 OTP verification error:', error);
      let errorMessage = 'حدث خطأ أثناء التحقق من الرمز';
      
      if (error.message?.includes('Invalid OTP')) {
        errorMessage = 'رمز التحقق غير صحيح، حاول مرة أخرى';
      } else if (error.message?.includes('expired')) {
        errorMessage = 'رمز التحقق منتهي الصلاحية، أعد إرسال الرمز';
      }
      
      Alert.alert('خطأ', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResendLoading(true);
      console.log('Resending OTP to:', phone);

      // Try WhatsApp first, fallback to SMS if it fails
      let { data, error } = await supabase.auth.signInWithOtp({
        phone: phone as string,
        options: {
          channel: 'sms',
          data: {
            phone_number: phone as string,
            ...(params.isRegistration === 'true' && params.name ? { full_name: params.name as string } : {})
          }
        }
      });

      // If WhatsApp fails (template issues), try SMS as fallback
      if (error && (error.message?.includes('60242') || error.message?.includes('template'))) {
        console.log('WhatsApp failed, trying SMS fallback...');
        const smsResult = await supabase.auth.signInWithOtp({
          phone: phone as string,
          options: {
            channel: 'sms',
            data: {
              phone_number: phone as string,
              ...(params.isRegistration === 'true' && params.name ? { full_name: params.name as string } : {})
            }
          }
        });
        data = smsResult.data;
        error = smsResult.error;
      }

      console.log('Resend response:', { 
        hasData: !!data, 
        hasError: !!error,
        errorMessage: error?.message,
        errorStatus: error?.status
      });

      if (error) {
        console.error('Resend error:', error);
        throw error;
      }

      console.log('OTP resent successfully');
      Alert.alert('نجاح', 'تم إعادة إرسال رمز التحقق');
      setCountdown(60); // Start 60-second countdown
    } catch (error: any) {
      console.error('Resend error:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إعادة إرسال الرمز');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
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
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <MaterialIcons name="arrow-back" size={24} color="#40E0D0" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>التحقق من الحساب</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Verification Icon */}
            <View style={styles.verificationContainer}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="verified-user" size={60} color="#40E0D0" />
                <View style={styles.iconBackground} />
              </View>
              <Text style={styles.verificationTitle}>التحقق من الرمز</Text>
              <Text style={styles.verificationSubtitle}>
                {params.isRegistration === 'true' 
                  ? 'أدخل رمز التحقق لإكمال التسجيل'
                  : 'أدخل رمز التحقق لتسجيل الدخول'
                }
              </Text>
            </View>

            {/* Phone Display */}
            <View style={styles.phoneCard}>
              <View style={styles.phoneHeader}>
                <MaterialIcons name="phone" size={20} color="#40E0D0" />
                <Text style={styles.phoneLabel}>رقم الهاتف</Text>
              </View>
              <Text style={styles.phoneValue}>{phone}</Text>
            </View>

            {/* OTP Input */}
            <View style={styles.otpCard}>
              <View style={styles.otpHeader}>
                <MaterialIcons name="lock" size={20} color="#40E0D0" />
                <Text style={styles.otpLabel}>رمز التحقق</Text>
              </View>
              <Text style={styles.otpHint}>
                تحقق من رسائل WhatsApp أو SMS الخاصة بك
              </Text>
              
              <View style={styles.otpInputContainer}>
                <TextInput
                  style={styles.otpInput}
                  placeholder="000000"
                  placeholderTextColor="#999"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                  textAlign="center"
                  autoFocus={true}
                />
              </View>
            </View>

            {/* Registration Note */}
            {params.isRegistration === 'true' && (
              <View style={styles.infoCard}>
                <MaterialIcons name="info" size={20} color="#28a745" />
                <Text style={styles.infoText}>
                  سيتم إنشاء حساب جديد بعد التحقق من الرمز
                </Text>
              </View>
            )}

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={loading}
            >
              <View style={styles.buttonContent}>
                <MaterialIcons 
                  name={loading ? "hourglass-empty" : "check-circle"} 
                  size={24} 
                  color="#fff" 
                />
                <Text style={styles.buttonText}>
                  {loading ? 'جاري التحقق...' : 'تحقق من الرمز'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Resend Section */}
            <View style={styles.resendCard}>
              <Text style={styles.resendLabel}>لم تستلم الرمز؟</Text>
              <TouchableOpacity
                style={[
                  styles.resendButton,
                  (resendLoading || countdown > 0) && styles.resendButtonDisabled
                ]}
                onPress={handleResend}
                disabled={resendLoading || countdown > 0}
              >
                <View style={styles.resendButtonContent}>
                  <MaterialIcons 
                    name={resendLoading ? "hourglass-empty" : "refresh"} 
                    size={20} 
                    color={countdown > 0 ? "#999" : "#40E0D0"} 
                  />
                  <Text style={[
                    styles.resendButtonText,
                    countdown > 0 && styles.resendButtonTextDisabled
                  ]}>
                    {resendLoading 
                      ? 'جاري الإرسال...' 
                      : countdown > 0 
                        ? `إعادة الإرسال (${countdown})` 
                        : 'إعادة الإرسال'
                    }
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Security Info */}
            <View style={styles.securityCard}>
              <MaterialIcons name="security" size={20} color="#28a745" />
              <Text style={styles.securityText}>
                رمز التحقق صالح لمدة 10 دقائق
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  verificationContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  iconBackground: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 50,
    backgroundColor: '#e0f7fa',
    opacity: 0.3,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  verificationSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  phoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  phoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  phoneValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  otpCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  otpHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  otpInputContainer: {
    alignItems: 'center',
  },
  otpInput: {
    width: 200,
    height: 60,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    color: '#333',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#28a745',
    marginLeft: 8,
    fontWeight: '500',
  },
  verifyButton: {
    backgroundColor: '#40E0D0',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#40E0D0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  resendCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resendLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#40E0D0',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonTextDisabled: {
    color: '#999',
  },
  securityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  securityText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    textAlign: 'center',
  },
}); 