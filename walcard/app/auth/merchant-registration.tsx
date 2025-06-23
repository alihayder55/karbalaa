import React, { useState, useEffect, useRef } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { checkNetworkConnectivity } from '../../lib/test-connection';

const { width, height } = Dimensions.get('window');

export default function MerchantRegistrationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = params.phone as string;
  const fullName = params.fullName as string;
  
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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

  const [formData, setFormData] = useState({
    businessName: '',
    chamberOfCommerceId: '',
    availableProducts: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.businessName.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال اسم النشاط التجاري');
      return false;
    }
    
    if (!formData.availableProducts.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال المنتجات المتاحة');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if user has a profile, create one if not
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              full_name: fullName,
              phone_number: phone,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);

        if (createProfileError) {
          console.error('Profile creation error:', createProfileError);
          throw new Error('Failed to create user profile');
        }
      }

      // تحويل المنتجات إلى مصفوفة
      const productsArray = formData.availableProducts
        .split(',')
        .map(product => product.trim())
        .filter(product => product.length > 0);

      // Create merchant record
      const { data, error } = await supabase
        .from('merchants')
        .insert([
          {
            user_id: user.id,
            business_name: formData.businessName.trim(),
            chamber_of_commerce_id: formData.chamberOfCommerceId.trim() || null,
            available_products: productsArray,
            is_approved: false
          }
        ]);

      if (error) {
        throw error;
      }

      // توجيه المستخدم إلى صفحة انتظار الموافقة
      router.replace({
        pathname: '/auth/pending-approval',
        params: { 
          userType: 'merchant',
          fullName: fullName
        }
      });
    } catch (error: any) {
      console.error('Merchant registration error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء التسجيل. حاول مرة أخرى.');
    } finally {
      setLoading(false);
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
              <View style={styles.merchantContainer}>
                <View style={styles.merchantIconContainer}>
                  <MaterialIcons name="business" size={80} color="#007AFF" />
                  <View style={styles.merchantIconBackground} />
                </View>
                <Text style={styles.merchantTitle}>تسجيل التاجر</Text>
                <Text style={styles.merchantSubtitle}>
                  انضم إلينا كتاجر وابدأ بيع منتجاتك بالجملة
                </Text>
              </View>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.sectionTitle}>
                <MaterialIcons name="store" size={24} color="#007AFF" />
                <Text style={styles.sectionTitleText}>معلومات التجارة</Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userInfoLabel}>المستخدم:</Text>
                <View style={styles.userInfoContainer}>
                  <MaterialIcons name="person" size={20} color="#007AFF" />
                  <Text style={styles.userInfoText}>{fullName}</Text>
                </View>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userInfoLabel}>رقم الهاتف:</Text>
                <View style={styles.userInfoContainer}>
                  <MaterialIcons name="phone" size={20} color="#007AFF" />
                  <Text style={styles.userInfoText}>{phone}</Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>اسم الشركة أو المحل *</Text>
                <View style={styles.textInputContainer}>
                  <MaterialIcons name="business" size={20} color="#666" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="أدخل اسم الشركة أو المحل"
                    placeholderTextColor="#999"
                    value={companyName}
                    onChangeText={setCompanyName}
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>نوع النشاط التجاري *</Text>
                <View style={styles.textInputContainer}>
                  <MaterialIcons name="category" size={20} color="#666" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="مثال: ملابس، إلكترونيات، مواد غذائية"
                    placeholderTextColor="#999"
                    value={businessType}
                    onChangeText={setBusinessType}
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>العنوان *</Text>
                <View style={styles.textInputContainer}>
                  <MaterialIcons name="location-on" size={20} color="#666" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="أدخل عنوان المحل أو الشركة"
                    placeholderTextColor="#999"
                    value={address}
                    onChangeText={setAddress}
                    textAlign="right"
                    multiline
                  />
                </View>
              </View>

              <View style={styles.infoBox}>
                <MaterialIcons name="info" size={20} color="#007AFF" />
                <Text style={styles.infoText}>
                  ستتم مراجعة طلبك من قبل فريقنا وسيتم التواصل معك قريباً
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <View style={styles.buttonContent}>
                  <MaterialIcons 
                    name={loading ? "hourglass-empty" : "check-circle"} 
                    size={24} 
                    color="#fff" 
                  />
                  <Text style={styles.buttonText}>
                    {loading ? 'جاري التسجيل...' : 'إكمال التسجيل'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <MaterialIcons name="arrow-back" size={20} color="#666" />
                <Text style={styles.backButtonText}>العودة</Text>
              </TouchableOpacity>
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
    marginBottom: 40,
  },
  merchantContainer: {
    alignItems: 'center',
  },
  merchantIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  merchantIconBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  merchantTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  merchantSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoText: {
    fontSize: 16,
    color: '#666',
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
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
    textAlign: 'right',
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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
}); 