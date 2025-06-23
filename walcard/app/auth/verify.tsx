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
import OTPInputView from '@twotalltotems/react-native-otp-input';
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
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Pulse animation for resend button
  useEffect(() => {
    if (countdown === 0) {
      Animated.loop(
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
      ).start();
    } else {
      pulseAnim.setValue(1);
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
      
      // If this is registration, check if user has a complete profile
      if (params.isRegistration === 'true') {
        try {
          // Check if user has a complete profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user?.id)
            .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error checking profile:', profileError);
            }

            // If no profile exists, create one
            if (!profileData) {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: data.user?.id,
                  full_name: params.name as string,
                  phone_number: phone as string,
                  created_at: new Date().toISOString(),
                });

              if (insertError) {
                console.error('Error creating profile:', insertError);
              }
            }

            // Check if user has merchant or store owner record
            const { data: merchantData } = await supabase
              .from('merchants')
              .select('*')
              .eq('user_id', data.user?.id)
              .single();

            const { data: storeOwnerData } = await supabase
              .from('store_owners')
              .select('*')
              .eq('user_id', data.user?.id)
              .single();

            // If user has complete registration, go to main app
            if (merchantData || storeOwnerData) {
              router.replace('/(tabs)');
            } else {
              // Redirect to user type selection
              router.replace({
                pathname: '/auth/user-type-selection',
                params: { phone, name: params.name }
              });
            }
          } catch (error) {
            console.error('Error in registration flow:', error);
            // Redirect to user type selection
            router.replace({
              pathname: '/auth/user-type-selection',
              params: { phone, name: params.name }
            });
          }
      } else {
        // For login, check if user has a complete profile and approval status
        try {
          // First check if user has a profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user?.id)
            .single();

          if (profileError || !profileData) {
            // No profile exists, this shouldn't happen for existing users
            Alert.alert(
              'خطأ في الحساب',
              'لم يتم العثور على معلومات الحساب. يرجى التواصل مع الدعم الفني.',
              [
                {
                  text: 'موافق',
                  onPress: () => router.replace('/auth/unified-auth')
                }
              ]
            );
            return;
          }

          // Check user approval status
          const { data: userData, error: userError } = await supabase
            .rpc('get_user_account_info', { phone_input: phone as string });

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
                <Text style={styles.verificationTitle}>تأكيد الهوية</Text>
                <Text style={styles.verificationSubtitle}>
                  تم إرسال رمز التحقق إلى رقم هاتفك
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
                  <OTPInputView
                    style={styles.otpInput}
                    pinCount={6}
                    code={otp}
                    onCodeChanged={(code) => {
                      console.log('OTP changed:', code);
                      setOtp(code);
                    }}
                    autoFocusOnLoad
                    codeInputFieldStyle={styles.otpInputField}
                    codeInputHighlightStyle={styles.otpInputHighlight}
                    onCodeFilled={(code) => {
                      console.log('OTP filled:', code);
                      setOtp(code);
                      // لا نرسل تلقائياً، نترك المستخدم يضغط على الزر
                    }}
                    secureTextEntry={false}
                    editable={true}
                  />
                </View>
              </View>

              {params.isRegistration === 'true' && (
                <View style={styles.registrationNote}>
                  <MaterialIcons name="person-add" size={20} color="#007AFF" />
                  <Text style={styles.registrationNoteText}>
                    إنشاء حساب جديد: {params.name}
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
                    {loading ? 'جاري التحقق...' : 'تأكيد الرمز'}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.resendSection}>
                <Text style={styles.resendLabel}>
                  لم تستلم الرمز؟
                </Text>
                
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    style={[styles.resendButton, countdown > 0 && styles.resendButtonDisabled]}
                    onPress={handleResend}
                    disabled={resendLoading || countdown > 0}
                  >
                    <View style={styles.resendButtonContent}>
                      <MaterialIcons 
                        name={resendLoading ? "hourglass-empty" : "refresh"} 
                        size={20} 
                        color={countdown > 0 ? "#999" : "#007AFF"} 
                      />
                      <Text style={[styles.resendButtonText, countdown > 0 && styles.resendButtonTextDisabled]}>
                        {resendLoading ? 'جاري الإرسال...' : 
                         countdown > 0 ? `إعادة الإرسال (${countdown})` : 'إعادة إرسال الرمز'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
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
}); 