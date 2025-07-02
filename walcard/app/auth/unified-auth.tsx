import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { checkNetworkConnectivity, testBasicConnection } from '../../lib/test-connection';

const { width, height } = Dimensions.get('window');

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

export default function UnifiedAuthScreen() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('+964');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [userAccountInfo, setUserAccountInfo] = useState<any>(null);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

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
        // المستخدم موجود
        setUserExists(true);
        setUserAccountInfo(accountInfo);
        
        // إرسال OTP للمستخدم الموجود (بغض النظر عن حالة الموافقة)
        await sendOTP(fullPhone, false, accountInfo.full_name);
      } else {
        // مستخدم جديد
        setUserExists(false);
        setUserAccountInfo(null);
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

  if (userExists === true) {
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
                  <Text style={styles.welcomeTitle}>مرحباً بك مرة أخرى</Text>
                  <Text style={styles.userName}>{userAccountInfo?.full_name}</Text>
                  <View style={styles.userTypeBadge}>
                    <MaterialIcons 
                      name={userAccountInfo?.user_type === 'merchant' ? 'business' : 'store'} 
                      size={16} 
                      color="#007AFF" 
                    />
                    <Text style={styles.userType}>
                      {userAccountInfo?.user_type === 'merchant' ? 'تاجر' : 'صاحب محل'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.sectionTitle}>
                  <MaterialIcons name="verified-user" size={24} color="#007AFF" />
                  <Text style={styles.sectionTitleText}>تأكيد الهوية</Text>
                </View>

                <View style={styles.phoneDisplay}>
                  <Text style={styles.phoneLabel}>رقم الهاتف المسجل:</Text>
                  <View style={styles.phoneValueContainer}>
                    <MaterialIcons name="phone" size={20} color="#007AFF" />
                    <Text style={styles.phoneValue}>
                      {formatPhoneNumber(countryCode, phoneNumber)}
                    </Text>
                  </View>
                </View>

                {!userAccountInfo?.is_approved && (
                  <View style={styles.approvalNote}>
                    <MaterialIcons name="info" size={20} color="#ff9800" />
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
                  <View style={styles.buttonContent}>
                    <MaterialIcons 
                      name={loading ? "hourglass-empty" : "login"} 
                      size={24} 
                      color="#fff" 
                    />
                    <Text style={styles.buttonText}>
                      {loading ? 'جاري الإرسال...' : 'تسجيل الدخول'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setUserExists(null);
                    setPhoneNumber('');
                  }}
                >
                  <MaterialIcons name="arrow-back" size={20} color="#666" />
                  <Text style={styles.backButtonText}>تغيير رقم الهاتف</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  if (userExists === false) {
    // واجهة إنشاء حساب جديد
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
                <View style={styles.newUserContainer}>
                  <View style={styles.welcomeIconContainer}>
                    <MaterialIcons name="person-add" size={64} color="#007AFF" />
                    <View style={styles.welcomeIconBackground} />
                  </View>
                  <Text style={styles.welcomeTitle}>مرحباً بك في ولكارد</Text>
                  <Text style={styles.welcomeSubtitle}>
                    منصة التجارة بالجملة الذكية
                  </Text>
                  <Text style={styles.welcomeDescription}>
                    انضم إلينا وابدأ رحلتك في عالم التجارة الرقمية
                  </Text>
                </View>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.sectionTitle}>
                  <MaterialIcons name="account-circle" size={24} color="#007AFF" />
                  <Text style={styles.sectionTitleText}>معلومات الحساب</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>الاسم الكامل</Text>
                  <View style={styles.textInputContainer}>
                    <MaterialIcons name="person" size={20} color="#666" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="أدخل اسمك الكامل"
                      placeholderTextColor="#999"
                      value={fullName}
                      onChangeText={setFullName}
                      textAlign="right"
                    />
                  </View>
                </View>

                <View style={styles.phoneDisplay}>
                  <Text style={styles.phoneLabel}>رقم الهاتف:</Text>
                  <View style={styles.phoneValueContainer}>
                    <MaterialIcons name="phone" size={20} color="#007AFF" />
                    <Text style={styles.phoneValue}>
                      {formatPhoneNumber(countryCode, phoneNumber)}
                    </Text>
                  </View>
                </View>

                <View style={styles.userTypeSelection}>
                  <Text style={styles.inputLabel}>نوع الحساب</Text>
                  <View style={styles.userTypeOptions}>
                    <TouchableOpacity
                      style={[styles.userTypeOption, styles.userTypeOptionActive]}
                      onPress={() => router.push({
                        pathname: '/auth/merchant-registration',
                        params: { 
                          phone: formatPhoneNumber(countryCode, phoneNumber),
                          fullName: fullName
                        }
                      })}
                    >
                      <MaterialIcons name="business" size={32} color="#007AFF" />
                      <Text style={styles.userTypeOptionTitle}>تاجر</Text>
                      <Text style={styles.userTypeOptionDescription}>
                        بيع المنتجات بالجملة
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.userTypeOption, styles.userTypeOptionActive]}
                      onPress={() => router.push({
                        pathname: '/auth/store-owner-registration',
                        params: { 
                          phone: formatPhoneNumber(countryCode, phoneNumber),
                          fullName: fullName
                        }
                      })}
                    >
                      <MaterialIcons name="store" size={32} color="#007AFF" />
                      <Text style={styles.userTypeOptionTitle}>صاحب محل</Text>
                      <Text style={styles.userTypeOptionDescription}>
                        شراء المنتجات للبيع
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <MaterialIcons name="info" size={20} color="#007AFF" />
                  <Text style={styles.infoText}>
                    اختر نوع الحساب المناسب لك لاستكمال التسجيل
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setUserExists(null);
                    setPhoneNumber('');
                    setFullName('');
                  }}
                >
                  <MaterialIcons name="arrow-back" size={20} color="#666" />
                  <Text style={styles.backButtonText}>العودة</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // واجهة إدخال رقم الهاتف
  return (
    <SafeAreaView style={styles.safeArea}>
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
                <View style={styles.logoContainer}>
                  <View style={styles.logoCircle}>
                    <MaterialIcons name="store" size={48} color="#007AFF" />
                  </View>
                  <Text style={styles.welcomeTitle}>مرحباً بك في ولكارد</Text>
                  <Text style={styles.welcomeSubtitle}>
                    منصة التجارة بالجملة الذكية
                  </Text>
                  <Text style={styles.welcomeDescription}>
                    انضم إلينا وابدأ رحلتك في عالم التجارة الرقمية
                  </Text>
                </View>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.sectionTitle}>
                  <MaterialIcons name="phone" size={24} color="#007AFF" />
                  <Text style={styles.sectionTitleText}>معلومات الاتصال</Text>
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
                </View>

                {showCountryPicker && (
                  <View style={styles.countryPickerContainer}>
                    <Animated.View 
                      style={[
                        styles.countryPicker,
                        {
                          opacity: fadeAnim,
                          transform: [{ translateY: slideAnim }]
                        }
                      ]}
                    >
                      <ScrollView 
                        style={styles.countryPickerScroll}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                      >
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
                      </ScrollView>
                    </Animated.View>
                  </View>
                )}

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
                  <Text style={styles.inputHint}>
                    سيتم إرسال رمز التحقق إلى هذا الرقم
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handlePhoneCheck}
                  disabled={loading}
                >
                  <View style={styles.buttonContent}>
                    <MaterialIcons 
                      name={loading ? "hourglass-empty" : "arrow-forward"} 
                      size={24} 
                      color="#fff" 
                    />
                    <Text style={styles.buttonText}>
                      {loading ? 'جاري التحقق...' : 'متابعة'}
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
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  userType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
  countryPickerContainer: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 10,
  },
  countryPicker: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: 200,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  countryPickerScroll: {
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
    fontSize: 16,
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
    padding: 16,
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
  },
  approvalNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
  },
  approvalNoteText: {
    fontSize: 16,
    color: '#666',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 16,
  },
  welcomeSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    marginTop: 40,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  inputHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusIndicator: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: '#28a745',
  },
  userTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 4,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  phoneValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  welcomeIconContainer: {
    alignItems: 'center',
  },
  welcomeIconBackground: {
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 16,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  userTypeSelection: {
    marginBottom: 20,
  },
  userTypeOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  userTypeOption: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  userTypeOptionActive: {
    borderColor: '#007AFF',
  },
  userTypeOptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
  },
  userTypeOptionDescription: {
    fontSize: 16,
    color: '#666',
  },
}); 