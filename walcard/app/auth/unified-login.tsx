import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { checkNetworkConnectivity, testBasicConnection } from '../../lib/test-connection';

// قائمة الدول العربية
const ARAB_COUNTRIES = [
  { code: '+964', name: 'العراق', flag: '🇮🇶' },
  { code: '+966', name: 'السعودية', flag: '🇸🇦' },
  { code: '+971', name: 'الإمارات', flag: '🇦🇪' },
  { code: '+965', name: 'الكويت', flag: '🇰🇼' },
  { code: '+974', name: 'قطر', flag: '🇶🇦' },
  { code: '+973', name: 'البحرين', flag: '🇧🇭' },
  { code: '+968', name: 'عُمان', flag: '🇴🇲' },
  { code: '+962', name: 'الأردن', flag: '🇯🇴' },
  { code: '+961', name: 'لبنان', flag: '🇱🇧' },
  { code: '+20', name: 'مصر', flag: '🇪🇬' },
];

export default function UnifiedLoginScreen() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('+964');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [userAccountInfo, setUserAccountInfo] = useState<any>(null);
  const [phoneChecked, setPhoneChecked] = useState(false);

  const formatPhoneNumber = (country: string, phone: string) => {
    const cleanPhone = phone.replace(/^\+?964|^0/, '');
    return `${country}${cleanPhone}`;
  };

  const checkUserExists = async (phone: string) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // Increased delay

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Checking user existence (attempt ${attempt}/${MAX_RETRIES})...`);
        
        // Check if user has a complete account (merchant or store_owner record)
        const { data, error } = await supabase
          .rpc('get_user_account_info', { phone_input: phone });

        if (error) {
          console.error(`Error checking user (attempt ${attempt}):`, error);
          
          // If it's a network error, timeout, or abort error and we have retries left, try again
          if ((error.message?.includes('Network request failed') || 
               error.message?.includes('Aborted') ||
               error.message?.includes('timeout')) && attempt < MAX_RETRIES) {
            console.log(`Network/timeout error, retrying in ${RETRY_DELAY}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            continue;
          }
          
          // For other errors or final attempt, return null
          return null;
        }

        console.log('User check successful:', data);
        
        // Only return user info if they have a complete account (merchant or store_owner)
        if (data && data.length > 0) {
          const userInfo = data[0];
          // Check if user has either merchant or store_owner record
          if (userInfo.has_account && (userInfo.user_type === 'merchant' || userInfo.user_type === 'store_owner')) {
            return userInfo;
          }
        }
        
        return null;
      } catch (error: any) {
        console.error(`Error checking user existence (attempt ${attempt}):`, error);
        
        // If it's a network error, timeout, or abort error and we have retries left, try again
        if ((error.message?.includes('Network request failed') || 
             error.message?.includes('Aborted') ||
             error.message?.includes('timeout')) && attempt < MAX_RETRIES) {
          console.log(`Network/timeout error, retrying in ${RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        }
        
        // For other errors or final attempt, return null
        return null;
      }
    }
    
    console.error('All attempts to check user failed');
    return null;
  };

  const handlePhoneCheck = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم الهاتف');
      return;
    }

    const fullPhone = formatPhoneNumber(countryCode, phoneNumber);
    setLoading(true);

    try {
      // Check network connectivity first
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        Alert.alert(
          'مشكلة في الاتصال', 
          __DEV__ 
            ? 'لا يوجد اتصال بالإنترنت. في وضع التطوير، تأكد من أن المحاكي متصل بالإنترنت.'
            : 'لا يوجد اتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.'
        );
        return;
      }

      // Test basic Supabase connection before trying RPC
      const isSupabaseConnected = await testBasicConnection();
      if (!isSupabaseConnected) {
        Alert.alert(
          'مشكلة في الاتصال', 
          __DEV__
            ? 'لا يمكن الاتصال بالخادم. في وضع التطوير، تحقق من إعدادات المحاكي.'
            : 'لا يمكن الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مرة أخرى.'
        );
        return;
      }

      console.log('Starting phone check for:', fullPhone);
      const accountInfo = await checkUserExists(fullPhone);
      
      if (accountInfo && accountInfo.has_account) {
        // المستخدم موجود - عرض واجهة تسجيل الدخول
        setUserExists(true);
        setUserAccountInfo(accountInfo);
        setPhoneChecked(true);
        // لا نرسل OTP هنا، ننتظر المستخدم للضغط على زر تسجيل الدخول
      } else {
        // مستخدم جديد - عرض واجهة إنشاء حساب جديد
        setUserExists(false);
        setUserAccountInfo(null);
        setPhoneChecked(true);
        // لا نرسل OTP هنا، ننتظر المستخدم لإدخال الاسم والضغط على زر الإرسال
      }
    } catch (error: any) {
      console.error('Error checking user:', error);
      
      let errorMessage = 'حدث خطأ أثناء التحقق من رقم الهاتف';
      
      if (error?.message?.includes('Network request failed') || error?.message?.includes('Aborted')) {
        errorMessage = 'مشكلة في الاتصال بالإنترنت، تحقق من اتصالك وحاول مرة أخرى';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'انتهت مهلة الاتصال، تحقق من سرعة الإنترنت وحاول مرة أخرى';
      } else if (error?.message?.includes('connection')) {
        errorMessage = 'لا يمكن الاتصال بالخادم، تحقق من اتصال الإنترنت';
      }
      
      Alert.alert('خطأ في الاتصال', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (phone: string, isRegistration: boolean, name?: string) => {
    try {
      setLoading(true);
      console.log('Sending OTP to:', phone);

      // Try WhatsApp first, fallback to SMS if it fails
      let { data, error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms',
          data: {
            phone_number: phone,
            ...(isRegistration && name ? { full_name: name } : {})
          }
        }
      });

      // If WhatsApp fails, try SMS as fallback
      if (error && (error.message?.includes('60242') || error.message?.includes('template'))) {
        console.log('WhatsApp failed, trying SMS fallback...');
        const smsResult = await supabase.auth.signInWithOtp({
          phone,
          options: {
            channel: 'sms',
            data: {
              phone_number: phone,
              ...(isRegistration && name ? { full_name: name } : {})
            }
          }
        });
        data = smsResult.data;
        error = smsResult.error;
      }

      if (error) {
        console.error('OTP sending error:', error);
        throw error;
      }

      console.log('OTP sent successfully');
      
      router.push({
        pathname: '/auth/verify',
        params: { 
          phone, 
          name: name || '',
          isRegistration: isRegistration ? 'true' : 'false'
        }
      });
    } catch (error: any) {
      console.error('OTP sending error:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  };

  const handleNewUserRegistration = async () => {
    if (!fullName.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال الاسم الكامل');
      return;
    }

    const fullPhone = formatPhoneNumber(countryCode, phoneNumber);
    await sendOTP(fullPhone, true, fullName.trim());
  };

  const handleExistingUserLogin = async () => {
    const fullPhone = formatPhoneNumber(countryCode, phoneNumber);
    await sendOTP(fullPhone, false, userAccountInfo?.full_name);
  };

  if (phoneChecked && userExists === true) {
    // واجهة تسجيل الدخول للمستخدم الموجود
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <View style={styles.welcomeContainer}>
                  <MaterialIcons name="account-circle" size={64} color="#007AFF" />
                  <Text style={styles.welcomeTitle}>مرحباً بك مرة أخرى</Text>
                  <Text style={styles.userName}>{userAccountInfo?.full_name}</Text>
                  <Text style={styles.userType}>
                    {userAccountInfo?.user_type === 'merchant' ? 'تاجر' : 'صاحب محل'}
                  </Text>
                </View>
              </View>

              <View style={styles.phoneDisplay}>
                <Text style={styles.phoneLabel}>رقم الهاتف:</Text>
                <Text style={styles.phoneValue}>
                  {formatPhoneNumber(countryCode, phoneNumber)}
                </Text>
              </View>

              {!userAccountInfo?.is_approved && (
                <View style={styles.approvalNote}>
                  <MaterialIcons name="info" size={16} color="#ff9800" />
                  <Text style={styles.approvalNoteText}>
                    حسابك قيد المراجعة. سيتم التحقق من حالة الموافقة بعد تسجيل الدخول.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleExistingUserLogin}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setUserExists(null);
                  setPhoneNumber('');
                  setPhoneChecked(false);
                }}
              >
                <MaterialIcons name="arrow-back" size={20} color="#666" />
                <Text style={styles.backButtonText}>تغيير رقم الهاتف</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  if (phoneChecked && userExists === false) {
    // واجهة التسجيل للمستخدم الجديد
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <View style={styles.newUserContainer}>
                  <MaterialIcons name="person-add" size={64} color="#28a745" />
                  <Text style={styles.title}>إنشاء حساب جديد</Text>
                  <Text style={styles.subtitle}>
                    مرحباً بك في ولكارد - منصة التجارة بالجملة
                  </Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>الاسم الكامل *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="اكتب اسمك الكامل"
                  placeholderTextColor="#999"
                  value={fullName}
                  onChangeText={setFullName}
                  textAlign="right"
                />
              </View>

              <View style={styles.phoneDisplay}>
                <Text style={styles.phoneLabel}>رقم الهاتف:</Text>
                <Text style={styles.phoneValue}>
                  {formatPhoneNumber(countryCode, phoneNumber)}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleNewUserRegistration}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'جاري الإرسال...' : 'متابعة إنشاء الحساب'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setUserExists(null);
                  setPhoneNumber('');
                  setFullName('');
                  setPhoneChecked(false);
                }}
              >
                <MaterialIcons name="arrow-back" size={20} color="#666" />
                <Text style={styles.backButtonText}>تغيير رقم الهاتف</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // واجهة إدخال رقم الهاتف الأولية
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>تسجيل الدخول / إنشاء حساب</Text>
              <Text style={styles.subtitle}>
                أدخل رقم هاتفك للمتابعة
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>اختر الدولة</Text>
              <TouchableOpacity 
                style={styles.countrySelector}
                onPress={() => setShowCountryPicker(!showCountryPicker)}
              >
                <View style={styles.countryInfo}>
                  <Text style={styles.countryFlag}>
                    {ARAB_COUNTRIES.find(c => c.code === countryCode)?.flag}
                  </Text>
                  <Text style={styles.countryName}>
                    {ARAB_COUNTRIES.find(c => c.code === countryCode)?.name}
                  </Text>
                  <Text style={styles.countryCode}>{countryCode}</Text>
                </View>
                <MaterialIcons 
                  name={showCountryPicker ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>

              {showCountryPicker && (
                <View style={styles.countryPicker}>
                  {ARAB_COUNTRIES.map((country) => (
                    <TouchableOpacity
                      key={country.code}
                      style={styles.countryOption}
                      onPress={() => {
                        setCountryCode(country.code);
                        setShowCountryPicker(false);
                      }}
                    >
                      <Text style={styles.countryFlag}>{country.flag}</Text>
                      <Text style={styles.countryName}>{country.name}</Text>
                      <Text style={styles.countryCode}>{country.code}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>رقم الهاتف</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.countryCodeDisplay}>{countryCode}</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="7XXXXXXXX"
                  placeholderTextColor="#999"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  textAlign="right"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handlePhoneCheck}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'جاري التحقق...' : 'متابعة'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
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
    textAlign: 'center',
    lineHeight: 24,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  userType: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  newUserContainer: {
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    color: '#333',
  },
  countrySelector: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryFlag: {
    fontSize: 24,
  },
  countryName: {
    fontSize: 16,
    color: '#333',
  },
  countryCode: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  countryPicker: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 8,
    maxHeight: 200,
  },
  countryOption: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  countryCodeDisplay: {
    padding: 16,
    backgroundColor: '#e9ecef',
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  phoneDisplay: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  phoneLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  phoneValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
  },
  approvalNote: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approvalNoteText: {
    fontSize: 16,
    color: '#333',
  },
}); 