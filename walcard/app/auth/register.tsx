import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  TextInput,
  Alert,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { testAuthConnection } from '../../lib/test-connection';

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

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const [name, setName] = useState('');
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

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
      const fullNumber = selectedCountry.dialCode + text;
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

  const validateForm = () => {
    console.log('=== VALIDATION START ===');
    console.log('Name:', name.trim());
    console.log('Phone:', formattedValue);
    console.log('Is valid phone:', isValidPhone);
    
    if (!name.trim()) {
      console.log('❌ Name validation failed');
      Alert.alert('خطأ في التحقق', 'الرجاء إدخال الاسم الكامل');
      return false;
    }
    
    if (name.trim().length < 2) {
      console.log('❌ Name too short');
      Alert.alert('خطأ في التحقق', 'الاسم يجب أن يكون أكثر من حرفين');
      return false;
    }
    
    if (!formattedValue.trim()) {
      console.log('❌ Phone number empty');
      Alert.alert('خطأ في التحقق', 'الرجاء إدخال رقم الهاتف');
      return false;
    }
    
    if (!validatePhone(formattedValue)) {
      console.log('❌ Phone validation failed');
      Alert.alert('خطأ في التحقق', 'الرجاء إدخال رقم هاتف صحيح');
      return false;
    }

    console.log('✅ Validation passed');
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log('=== REGISTRATION START ===');
      console.log('Phone number:', formattedValue);
      console.log('Name:', name.trim());
      
      // Test connection first
      console.log('Testing connection...');
      const isConnected = await testAuthConnection();
      if (!isConnected) {
        throw new Error('لا يمكن الاتصال بالخادم، تحقق من اتصال الإنترنت');
      }
      console.log('✅ Connection test passed');
      
      // Try WhatsApp first, fallback to SMS if it fails
      console.log('Attempting WhatsApp OTP...');
      let { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedValue,
        options: {
          channel: 'sms',
          data: {
            phone_number: formattedValue,
            full_name: name.trim()
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
              phone_number: formattedValue,
              full_name: name.trim()
            }
          }
        });
        data = smsResult.data;
        error = smsResult.error;
      }

      console.log('=== REGISTRATION RESPONSE ===');
      console.log('Has data:', !!data);
      console.log('Has error:', !!error);
      console.log('Error message:', error?.message);
      console.log('Error status:', error?.status);
      console.log('Error details:', error);

      if (error) {
        console.error('❌ Registration error:', error);
        throw error;
      }

      console.log('✅ OTP sent successfully');
      Alert.alert('نجاح', 'تم إرسال رمز التحقق');
      router.push({
        pathname: '/auth/verify',
        params: { 
          phone: formattedValue,
          name: name.trim(),
          isRegistration: 'true'
        }
      });
    } catch (error: any) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('Error status:', error?.status);
      console.error('Full error:', error);
      
      let errorMessage = 'حدث خطأ أثناء إرسال رمز التحقق';
      
      if (error?.message?.includes('لا يمكن الاتصال بالخادم')) {
        errorMessage = error.message;
      } else if (error?.message?.includes('60200')) {
        errorMessage = 'خطأ في إعدادات Twilio، يرجى التحقق من التكوين';
      } else if (error?.message?.includes('60242')) {
        errorMessage = 'لم يتم العثور على قالب WhatsApp معتمد، يرجى التحقق من إعدادات Twilio';
      } else if (error?.message?.includes('60223')) {
        errorMessage = 'قناة SMS معطلة في Twilio، يرجى تفعيلها في إعدادات Twilio';
      } else if (error?.message?.includes('Delivery channel disabled')) {
        errorMessage = 'قناة التوصيل معطلة، يرجى التحقق من إعدادات Twilio';
      } else if (error?.message?.includes('Invalid phone number')) {
        errorMessage = 'رقم الهاتف غير صحيح';
      } else if (error?.message?.includes('rate limit')) {
        errorMessage = 'تم تجاوز الحد المسموح، حاول مرة أخرى لاحقاً';
      } else if (error?.message?.includes('whatsapp')) {
        errorMessage = 'تأكد من أن رقم الهاتف مسجل على WhatsApp';
      } else if (error?.message?.includes('Network request failed')) {
        errorMessage = 'مشكلة في الاتصال بالإنترنت، تحقق من اتصالك';
      } else if (error?.message?.includes('Invalid parameter')) {
        errorMessage = 'خطأ في إعدادات Twilio، تحقق من التكوين في Supabase';
      } else if (error?.message?.includes('Invalid From and To pair')) {
        errorMessage = 'خطأ في إعدادات Twilio: يجب أن يكون المرسل والمستقبل من نفس القناة (WhatsApp)';
      } else if (error?.message?.includes('21910')) {
        errorMessage = 'خطأ في إعدادات Twilio: تحقق من تكوين WhatsApp Business API';
      } else if (error?.message?.includes('phone')) {
        errorMessage = 'تأكد من أن رقم الهاتف صحيح ومُسجل';
      } else if (error?.message?.includes('auth')) {
        errorMessage = 'مشكلة في المصادقة، تحقق من إعدادات التطبيق';
      }
      
      console.error('Final error message:', errorMessage);
      Alert.alert('خطأ في التسجيل', errorMessage);
    } finally {
      setLoading(false);
      console.log('=== REGISTRATION END ===');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
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
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <MaterialIcons name="arrow-back" size={24} color="#40E0D0" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                  <Text style={styles.title}>إنشاء حساب جديد</Text>
                  <Text style={styles.subtitle}>أدخل بياناتك للبدء</Text>
                </View>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>الاسم الكامل</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="person" size={20} color="#40E0D0" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="أدخل اسمك الكامل"
                      placeholderTextColor="#999"
                      value={name}
                      onChangeText={setName}
                      textAlign="right"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>رقم الهاتف</Text>
                  <View style={styles.phoneInputContainer}>
                    <TouchableOpacity
                      style={styles.countrySelector}
                      onPress={() => setShowCountryPicker(true)}
                    >
                      <Text style={styles.countryCode}>{selectedCountry.dialCode}</Text>
                      <MaterialIcons name="keyboard-arrow-down" size={20} color="#666" />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="7XXXXXXXX"
                      placeholderTextColor="#999"
                      value={phoneNumber}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      textAlign="right"
                    />
                  </View>
                  {!isValidPhone && phoneNumber.length > 0 && (
                    <Text style={styles.errorText}>رقم الهاتف غير صحيح</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.registerButton, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  <View style={styles.buttonContent}>
                    <MaterialIcons 
                      name={loading ? "hourglass-empty" : "person-add"} 
                      size={24} 
                      color="#fff" 
                    />
                    <Text style={styles.buttonText}>
                      {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.infoBox}>
                  <MaterialIcons name="security" size={20} color="#28a745" />
                  <Text style={styles.infoText}>
                    بياناتك محمية ومشفرة بالكامل
                  </Text>
                </View>
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
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.countryList}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={styles.countryItem}
                  onPress={() => selectCountry(country)}
                >
                  <Text style={styles.countryName}>{country.name}</Text>
                  <Text style={styles.countryDialCode}>{country.dialCode}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 16,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#e9ecef',
    gap: 4,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4757',
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: '#40E0D0',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  countryList: {
    padding: 20,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  countryName: {
    fontSize: 16,
    color: '#333',
  },
  countryDialCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#40E0D0',
  },
}); 