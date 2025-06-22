import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function VerifyScreen() {
  const router = useRouter();
  const { phone, name, isRegistration } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('خطأ', 'الرجاء إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    try {
      setLoading(true);
      console.log('Verifying OTP:', { phone, otp, isRegistration });

      // Try WhatsApp verification first
      let { data, error } = await supabase.auth.verifyOtp({
        phone: phone as string,
        token: otp,
        type: 'sms'
      });

      // If WhatsApp verification fails, try SMS
      if (error && (error.message?.includes('Invalid') || error.message?.includes('whatsapp'))) {
        console.log('WhatsApp verification failed, trying SMS...');
        const smsResult = await supabase.auth.verifyOtp({
          phone: phone as string,
          token: otp,
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
      
      // If this is a registration, we need to create a user profile
      if (isRegistration === 'true' && name) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user?.id,
                full_name: name as string,
                phone_number: phone as string,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Don't throw here, as the user is already authenticated
          }
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      // If this is registration, go to user type selection
      if (isRegistration === 'true') {
        router.replace({
          pathname: '/auth/user-type-selection',
          params: { phone, name }
        });
      } else {
        // For login, go directly to tabs
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
      setLoading(true);
      console.log('Resending OTP to:', phone);

      // Try WhatsApp first, fallback to SMS if it fails
      let { data, error } = await supabase.auth.signInWithOtp({
        phone: phone as string,
        options: {
          channel: 'whatsapp',
          data: {
            phone_number: phone as string,
            ...(isRegistration === 'true' && name ? { full_name: name as string } : {})
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
              ...(isRegistration === 'true' && name ? { full_name: name as string } : {})
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
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>التحقق من رقم الهاتف</Text>
        <Text style={styles.subtitle}>
          تم إرسال رمز التحقق إلى رقم هاتفك عبر WhatsApp أو SMS
        </Text>
        <Text style={styles.whatsappNote}>
          تحقق من رسائل WhatsApp أو SMS الخاصة بك
        </Text>
        {isRegistration === 'true' && (
          <Text style={styles.registrationNote}>
            إنشاء حساب جديد: {name}
          </Text>
        )}
      </View>

      <OTPInputView
        style={styles.otpInput}
        pinCount={6}
        code={otp}
        onCodeChanged={setOtp}
        autoFocusOnLoad
        codeInputFieldStyle={styles.otpInputField}
        codeInputHighlightStyle={styles.otpInputHighlight}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'جاري التحقق...' : 'تحقق من الرمز'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResend}
        disabled={loading}
      >
        <View style={styles.resendButtonContent}>
          <MaterialIcons name="message" size={20} color="#25D366" />
          <Text style={styles.resendButtonText}>إعادة إرسال الرمز عبر WhatsApp</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  whatsappNote: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  registrationNote: {
    fontSize: 14,
    color: '#28a745',
    textAlign: 'center',
    fontWeight: '600',
  },
  otpInput: {
    width: '100%',
    height: 100,
    marginBottom: 30,
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
  },
  otpInputHighlight: {
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  button: {
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
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
}); 