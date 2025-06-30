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
  SafeAreaView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { checkNetworkConnectivity } from '../../lib/test-connection';

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
      console.log('Verifying OTP:', { phone, otp: cleanOtp, isRegistration: params.isRegistration });

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

      console.log('OTP verification response:', { 
        hasData: !!data, 
        hasError: !!error,
        errorMessage: error?.message,
        errorStatus: error?.status
      });

      if (error) {
        console.error('OTP verification error:', error);
        throw error;
      }

      console.log('OTP verified successfully');
      
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
        // For existing users, check approval status
        try {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('full_name, user_type, is_approved')
            .eq('phone', phone)
            .limit(1);

          if (!userError && userData && userData.length > 0) {
            const userInfo = userData[0];
            
            if (!userInfo.is_approved) {
              // User is not approved, redirect to pending approval
              Alert.alert(
                'حساب قيد المراجعة',
                'تم تسجيل الدخول بنجاح، لكن حسابك قيد المراجعة. سيتم إشعارك عند الموافقة عليه.',
                [
                  {
                    text: 'موافق',
                    onPress: () => router.replace({
                      pathname: '/auth/pending-approval',
                      params: { 
                        userType: userInfo.user_type,
                        fullName: userInfo.full_name
                      }
                    })
                  }
                ]
              );
              return;
            }
          }
        } catch (error) {
          console.error('Error checking user status:', error);
        }

        // User is approved or error occurred, go to main app
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
    } catch (error: any) {
      console.error('OTP verification error:', error);
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
          channel: 'whatsapp',
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
              <View style={styles.verificationContainer}>
                <View style={styles.verificationIconContainer}>
                  <MaterialIcons name="verified-user" size={80} color="#007AFF" />
                  <View style={styles.verificationIconBackground} />
                </View>
                <Text style={styles.verificationTitle}>التحقق من الرمز</Text>
                <Text style={styles.verificationSubtitle}>
                  {params.isRegistration === 'true' 
                    ? 'أدخل رمز التحقق لإكمال التسجيل'
                    : 'أدخل رمز التحقق لتسجيل الدخول'
                  }
                </Text>
              </View>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.phoneDisplay}>
                <Text style={styles.phoneLabel}>رقم الهاتف:</Text>
                <View style={styles.phoneValueContainer}>
                  <MaterialIcons name="phone" size={20} color="#007AFF" />
                  <Text style={styles.phoneValue}>{phone}</Text>
                </View>
              </View>

              <View style={styles.otpContainer}>
                <Text style={styles.otpLabel}>أدخل رمز التحقق</Text>
                <Text style={styles.otpHint}>
                  تحقق من رسائل WhatsApp أو SMS الخاصة بك
                </Text>
                
                <View style={styles.otpInputContainer}>
                  {otpInputError ? (
                    <View style={styles.otpErrorContainer}>
                      <Text style={styles.otpErrorText}>
                        حدث خطأ في إدخال الرمز، حاول مرة أخرى
                      </Text>
                      <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => setOtpInputError(false)}
                      >
                        <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
                      </TouchableOpacity>
                      
                      {/* Fallback text input */}
                      <View style={styles.fallbackInputContainer}>
                        <Text style={styles.fallbackInputLabel}>
                          أو أدخل الرمز يدوياً:
                        </Text>
                        <TextInput
                          style={styles.fallbackInput}
                          placeholder="000000"
                          placeholderTextColor="#999"
                          value={otp}
                          onChangeText={setOtp}
                          keyboardType="numeric"
                          maxLength={6}
                          textAlign="center"
                          autoFocus={false}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.otpWrapper}>
                      {/* Temporary simple OTP input for testing */}
                      <Text style={styles.otpLabel}>أدخل رمز التحقق (6 أرقام):</Text>
                      <TextInput
                        style={styles.simpleOtpInput}
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
                  )}
                </View>
              </View>

              {params.isRegistration === 'true' && (
                <View style={styles.registrationNote}>
                  <MaterialIcons name="info" size={16} color="#28a745" />
                  <Text style={styles.registrationNoteText}>
                    سيتم إنشاء حساب جديد بعد التحقق من الرمز
                  </Text>
                </View>
              )}

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

              <View style={styles.resendSection}>
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
                        color={countdown > 0 ? "#999" : "#007AFF"} 
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

              <View style={styles.infoBox}>
                <MaterialIcons name="security" size={20} color="#28a745" />
                <Text style={styles.infoText}>
                  رمز التحقق صالح لمدة 10 دقائق
                </Text>
              </View>
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
    backgroundColor: '#fff',
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
    alignItems: 'center',
    marginBottom: 30,
  },
  verificationContainer: {
    alignItems: 'center',
  },
  verificationIconContainer: {
    position: 'relative',
  },
  verificationIconBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: '#fff',
    opacity: 0.5,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  verificationSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  phoneDisplay: {
    marginBottom: 20,
  },
  phoneLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  phoneValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneValue: {
    fontSize: 16,
    marginLeft: 10,
  },
  otpContainer: {
    marginBottom: 20,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  otpHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  otpInputContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  otpInput: {
    width: '100%',
    height: 60,
  },
  otpInputField: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    color: '#333',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  otpInputHighlight: {
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  otpErrorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  otpErrorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registrationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  registrationNoteText: {
    fontSize: 14,
    color: '#28a745',
    textAlign: 'center',
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  },
  resendSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  resendLabel: {
    fontSize: 16,
    color: '#666',
  },
  resendButton: {
    padding: 10,
  },
  resendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 10,
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonTextDisabled: {
    color: '#999',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  fallbackInputContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  fallbackInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  fallbackInput: {
    width: 120,
    height: 50,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  otpWrapper: {
    alignItems: 'center',
  },
  simpleOtpInput: {
    width: 120,
    height: 50,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 