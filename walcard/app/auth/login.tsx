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
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  TextInput,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { testAuthConnection } from '../../lib/test-connection';

const { width, height } = Dimensions.get('window');

// Country codes for common countries
const countries = [
  { code: 'SA', name: 'السعودية', dialCode: '+966' },
  { code: 'IQ', name: 'العراق', dialCode: '+964' },
  { code: 'AE', name: 'الإمارات', dialCode: '+971' },
  { code: 'KW', name: 'الكويت', dialCode: '+965' },
  { code: 'QA', name: 'قطر', dialCode: '+974' },
  { code: 'BH', name: 'البحرين', dialCode: '+973' },
  { code: 'OM', name: 'عمان', dialCode: '+968' },
  { code: 'JO', name: 'الأردن', dialCode: '+962' },
  { code: 'EG', name: 'مصر', dialCode: '+20' },
  { code: 'LB', name: 'لبنان', dialCode: '+961' },
];

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[1]); // Default to Iraq
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  useEffect(() => {
    // Test connection on component mount
    testAuthConnection();
  }, []);

  const validatePhone = (text: string) => {
    try {
      // Simple phone validation - must have at least 8 digits after country code
      const cleanPhone = text.replace(/[^\d]/g, '');
      const isValid = cleanPhone.length >= 8;
      setIsValidPhone(isValid);
      return isValid;
    } catch (error) {
      console.log('Phone validation error:', error);
      setIsValidPhone(false);
      return false;
    }
  };

  const handlePhoneChange = (text: string) => {
    try {
      setPhoneNumber(text);
      const fullNumber = selectedCountry?.dialCode + text;
      setFormattedValue(fullNumber);
      validatePhone(text);
    } catch (error) {
      console.log('Phone change error:', error);
    }
  };

  const selectCountry = (country: any) => {
    try {
      setSelectedCountry(country);
      setShowCountryPicker(false);
      // Update formatted value with new country code
      const fullNumber = country.dialCode + phoneNumber;
      setFormattedValue(fullNumber);
      validatePhone(phoneNumber);
    } catch (error) {
      console.log('Country selection error:', error);
    }
  };

  const handleLogin = async () => {
    if (!validatePhone(formattedValue)) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم هاتف صحيح');
      return;
    }

    if (!formattedValue.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم الهاتف');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting WhatsApp OTP...');
      let { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedValue,
        options: {
          channel: 'whatsapp',
          data: {
            phone_number: formattedValue
          }
        }
      });

      // If WhatsApp fails (template issues), try SMS as fallback
      if (error && (error.message?.includes('60242') || error.message?.includes('template'))) {
        console.log('WhatsApp failed, trying SMS fallback...');
        const smsResult = await supabase.auth.signInWithOtp({
          phone: formattedValue,
          options: {
            channel: 'sms',
            data: {
              phone_number: formattedValue
            }
          }
        });
        data = smsResult.data;
        error = smsResult.error;
      }

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
      Alert.alert('نجاح', 'تم إرسال رمز التحقق عبر WhatsApp أو SMS');
      router.push({
        pathname: '/auth/verify',
        params: { phone: formattedValue }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'حدث خطأ أثناء إرسال رمز التحقق';
      
      if (error.message?.includes('لا يمكن الاتصال بالخادم')) {
        errorMessage = error.message;
      } else if (error.message?.includes('60200')) {
        errorMessage = 'خطأ في إعدادات Twilio، يرجى التحقق من التكوين';
      } else if (error.message?.includes('60242')) {
        errorMessage = 'لم يتم العثور على قالب WhatsApp معتمد، يرجى التحقق من إعدادات Twilio';
      } else if (error.message?.includes('60223')) {
        errorMessage = 'قناة SMS معطلة في Twilio، يرجى تفعيلها في إعدادات Twilio';
      } else if (error.message?.includes('Delivery channel disabled')) {
        errorMessage = 'قناة التوصيل معطلة، يرجى التحقق من إعدادات Twilio';
      } else if (error.message?.includes('Invalid phone number')) {
        errorMessage = 'رقم الهاتف غير صحيح';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'تم تجاوز الحد المسموح، حاول مرة أخرى لاحقاً';
      } else if (error.message?.includes('whatsapp')) {
        errorMessage = 'تأكد من أن رقم الهاتف مسجل على WhatsApp';
      } else if (error.message?.includes('Network request failed')) {
        errorMessage = 'مشكلة في الاتصال بالإنترنت، تحقق من اتصالك';
      } else if (error.message?.includes('Invalid parameter')) {
        errorMessage = 'خطأ في إعدادات Twilio، تحقق من التكوين في Supabase';
      } else if (error.message?.includes('Invalid From and To pair')) {
        errorMessage = 'خطأ في إعدادات Twilio: يجب أن يكون المرسل والمستقبل من نفس القناة';
      } else if (error.message?.includes('21910')) {
        errorMessage = 'خطأ في إعدادات Twilio: تحقق من تكوين WhatsApp Business API';
      }
      
      Alert.alert('خطأ', errorMessage);
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
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>تسجيل الدخول</Text>
                <Text style={styles.subtitle}>أدخل رقم هاتفك للبدء</Text>
                <Text style={styles.whatsappNote}>
                  سيتم إرسال رمز التحقق عبر WhatsApp أو SMS
                </Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>رقم الهاتف</Text>
                  <View style={styles.phoneInputContainer}>
                    <TouchableOpacity
                      style={styles.countryPicker}
                      onPress={() => setShowCountryPicker(true)}
                    >
                      <View style={styles.countryInfo}>
                        <Text style={styles.countryCode}>{selectedCountry?.dialCode || '+964'}</Text>
                        <Text style={styles.countryName}>{selectedCountry?.name || 'العراق'}</Text>
                      </View>
                      <MaterialIcons name="keyboard-arrow-down" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <View style={styles.phoneInputDivider} />
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="رقم الهاتف"
                      placeholderTextColor="#999"
                      value={phoneNumber || ''}
                      onChangeText={handlePhoneChange}
                      textAlign="right"
                      keyboardType="phone-pad"
                      maxLength={15}
                    />
                  </View>
                  {formattedValue && !isValidPhone && (
                    <Text style={styles.errorText}>
                      الرجاء إدخال رقم هاتف صحيح
                    </Text>
                  )}
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.button, 
                    (!isValidPhone || loading) && styles.buttonDisabled
                  ]}
                  onPress={handleLogin}
                  disabled={loading || !isValidPhone}
                >
                  <View style={styles.buttonContent}>
                    <MaterialIcons name="message" size={20} color="#fff" />
                    <Text style={styles.buttonText}>
                      {loading ? 'جاري الإرسال...' : 'متابعة عبر WhatsApp'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => router.push('/auth/register')}
                >
                  <Text style={styles.linkText}>ليس لديك حساب؟ إنشاء حساب جديد</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر الدولة</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCountryPicker(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.countryList} showsVerticalScrollIndicator={false}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryItem,
                    selectedCountry?.code === country.code && styles.selectedCountryItem
                  ]}
                  onPress={() => selectCountry(country)}
                >
                  <View style={styles.countryItemContent}>
                    <View style={styles.countryItemInfo}>
                      <Text style={styles.countryItemName}>{country.name}</Text>
                      <Text style={styles.countryItemCode}>{country.dialCode}</Text>
                    </View>
                    {selectedCountry?.code === country.code && (
                      <MaterialIcons name="check" size={20} color="#007AFF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
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
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 4,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
  },
  countryInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2,
  },
  countryName: {
    fontSize: 12,
    color: '#666',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  phoneInputDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e9ecef',
    marginHorizontal: 8,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
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
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  countryList: {
    maxHeight: 400,
  },
  countryItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  countryItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryItemInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  countryItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  countryItemCode: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  selectedCountryItem: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
}); 