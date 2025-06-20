import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import PhoneNumberInput from 'react-native-phone-number-input';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const phoneInput = useRef<PhoneNumberInput>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setIsKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!phoneInput.current?.isValidNumber(formattedValue)) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم هاتف صحيح');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to send OTP via WhatsApp to:', formattedValue);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedValue,
        options: {
          channel: 'whatsapp',
          data: {
            phone_number: formattedValue
          }
        }
      });

      console.log('Supabase response:', { 
        hasData: !!data, 
        hasError: !!error,
        errorMessage: error?.message,
        errorStatus: error?.status
      });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('OTP sent successfully');
      router.push({
        pathname: '/auth/verify',
        params: { phone: formattedValue }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollView}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <Text style={styles.title}>تسجيل الدخول</Text>
              <Text style={styles.subtitle}>أدخل رقم هاتفك للبدء</Text>

              <View style={styles.formContainer}>
                <PhoneNumberInput
                  ref={phoneInput}
                  defaultValue={phoneNumber}
                  defaultCode="IQ"
                  layout="first"
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                  }}
                  onChangeFormattedText={(text) => {
                    setFormattedValue(text);
                  }}
                  withDarkTheme={false}
                  withShadow
                  containerStyle={styles.phoneInput}
                  textContainerStyle={styles.phoneInputText}
                  textInputStyle={styles.phoneInputTextInput}
                  codeTextStyle={styles.phoneInputCodeText}
                />
                <Text style={styles.errorText}>
                  {phoneInput.current?.isValidNumber(formattedValue) ? '' : 'الرجاء إدخال رقم هاتف صحيح'}
                </Text>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading || !phoneInput.current?.isValidNumber(formattedValue)}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'جاري الإرسال...' : 'متابعة'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
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
  },
  content: {
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignContent: 'center',
    marginTop: 240,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginTop: 15,
  },
  phoneInput: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  phoneInputText: {
    backgroundColor: 'transparent',
  },
  phoneInputTextInput: {
    fontSize: 16,
    color: '#000',
  },
  phoneInputCodeText: {
    fontSize: 16,
  },
  errorText: {
    color: '#666',
    paddingTop: 5,
    paddingBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 