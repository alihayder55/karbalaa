import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import { supabase } from '../../lib/supabase';

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('خطأ', 'الرجاء إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    try {
      setLoading(true);
      console.log('Verifying OTP:', { phone, otp });

      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone as string,
        token: otp,
        type: 'sms'
      });

      console.log('Verification response:', { 
        hasData: !!data, 
        hasError: !!error,
        errorMessage: error?.message,
        errorStatus: error?.status
      });

      if (error) {
        console.error('Verification error:', error);
        throw error;
      }

      console.log('OTP verified successfully');
      Alert.alert('نجاح', 'تم التحقق بنجاح');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء التحقق من الرمز');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      console.log('Resending OTP to:', phone);

      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone as string,
        options: {
          channel: 'whatsapp'
        }
      });

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
      <Text style={styles.title}>التحقق من رقم الهاتف</Text>
      <Text style={styles.subtitle}>
        تم إرسال رمز التحقق إلى رقم هاتفك عبر WhatsApp
      </Text>

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
          {loading ? 'جاري التحقق...' : 'تحقق'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResend}
        disabled={loading}
      >
        <Text style={styles.resendButtonText}>إعادة إرسال الرمز</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  otpInput: {
    width: '100%',
    height: 100,
    marginBottom: 30,
  },
  otpInputField: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    color: '#000',
    fontSize: 20,
  },
  otpInputHighlight: {
    borderColor: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    padding: 10,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
}); 