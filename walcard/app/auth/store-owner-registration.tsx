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

export default function StoreOwnerRegistrationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = params.phone as string;
  const fullName = params.fullName as string;
  
  const [storeName, setStoreName] = useState('');
  const [storeType, setStoreType] = useState('');
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

  const handleInputChange = (field: string, value: string) => {
    // This function is no longer needed as we're using individual state variables
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!storeName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المحل');
      return;
    }
    if (!storeType.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال نوع المحل');
      return;
    }
    if (!address.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان المحل');
      return;
    }

    setLoading(true);

    try {
      // Check network connectivity
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        Alert.alert('خطأ في الاتصال', 'يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى');
        return;
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('خطأ', 'لم يتم العثور على المستخدم. يرجى تسجيل الدخول مرة أخرى.');
        router.replace('/auth/unified-auth');
        return;
      }

      // Create or update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          phone_number: phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile error:', profileError);
      }

      // Create store owner record
      const { error: storeOwnerError } = await supabase
        .from('store_owners')
        .insert({
          user_id: user.id,
          store_name: storeName.trim(),
          address: address.trim(),
          store_type: storeType.trim(),
          is_approved: false
        });

      if (storeOwnerError) {
        console.error('Store owner creation error:', storeOwnerError);
        Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء حساب صاحب المحل');
        return;
      }

      Alert.alert(
        'تم التسجيل بنجاح',
        'تم تسجيل طلبك بنجاح. سيتم مراجعته من قبل فريقنا وسيتم التواصل معك قريباً.',
        [
          {
            text: 'موافق',
            onPress: () => router.replace({
              pathname: '/auth/pending-approval',
              params: { 
                userType: 'store_owner',
                fullName: fullName
              }
            })
          }
        ]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء التسجيل');
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
              <View style={styles.storeOwnerContainer}>
                <View style={styles.storeOwnerIconContainer}>
                  <MaterialIcons name="store" size={80} color="#FF6B35" />
                  <View style={styles.storeOwnerIconBackground} />
                </View>
                <Text style={styles.storeOwnerTitle}>تسجيل صاحب المحل</Text>
                <Text style={styles.storeOwnerSubtitle}>
                  انضم إلينا كصاحب محل وابدأ شراء المنتجات بالجملة
                </Text>
              </View>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.sectionTitle}>
                <MaterialIcons name="store" size={24} color="#FF6B35" />
                <Text style={styles.sectionTitleText}>معلومات المحل</Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userInfoLabel}>المستخدم:</Text>
                <View style={styles.userInfoContainer}>
                  <MaterialIcons name="person" size={20} color="#FF6B35" />
                  <Text style={styles.userInfoText}>{fullName}</Text>
                </View>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userInfoLabel}>رقم الهاتف:</Text>
                <View style={styles.userInfoContainer}>
                  <MaterialIcons name="phone" size={20} color="#FF6B35" />
                  <Text style={styles.userInfoText}>{phone}</Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>اسم المحل *</Text>
                <View style={styles.textInputContainer}>
                  <MaterialIcons name="store" size={20} color="#666" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="أدخل اسم المحل"
                    placeholderTextColor="#999"
                    value={storeName}
                    onChangeText={setStoreName}
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>عنوان المحل *</Text>
                <View style={styles.textInputContainer}>
                  <MaterialIcons name="location-on" size={20} color="#666" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="أدخل عنوان المحل الكامل"
                    placeholderTextColor="#999"
                    value={address}
                    onChangeText={setAddress}
                    textAlign="right"
                    multiline
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>نوع المحل *</Text>
                <View style={styles.textInputContainer}>
                  <MaterialIcons name="category" size={20} color="#666" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="مثال: بقالة، صيدلية، محل ملابس، مطعم"
                    placeholderTextColor="#999"
                    value={storeType}
                    onChangeText={setStoreType}
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.infoBox}>
                <MaterialIcons name="info" size={20} color="#FF6B35" />
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
  storeOwnerContainer: {
    alignItems: 'center',
  },
  storeOwnerIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff4f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeOwnerIconBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#fff',
  },
  storeOwnerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  storeOwnerSubtitle: {
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
    backgroundColor: '#fff4f0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#FF6B35',
    lineHeight: 20,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#FF6B35',
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