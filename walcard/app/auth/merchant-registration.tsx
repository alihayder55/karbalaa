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
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import { supabase, createUser, createMerchant, getBusinessTypes, getCities, getWorkingDays } from '../../lib/supabase';
import { checkNetworkConnectivity } from '../../lib/test-connection';
import { uploadIdentityImage, uploadBusinessImage, uploadMerchantStoreImage } from '../../lib/supabase-storage';

const { width, height } = Dimensions.get('window');

// أنواع النشاط التجاري
const BUSINESS_TYPES = [
  'مواد غذائية',
  'لحوم',
  'ألبان',
  'منظفات',
  'خضروات وفواكه',
  'مخبز',
  'مطعم',
  'كافيه',
  'سوبر ماركت',
  'هايبر ماركت',
  'صيدلية',
  'أخرى'
];

// أيام العمل
const WORKING_DAYS = [
  { id: 'saturday', name: 'السبت' },
  { id: 'sunday', name: 'الأحد' },
  { id: 'monday', name: 'الاثنين' },
  { id: 'tuesday', name: 'الثلاثاء' },
  { id: 'wednesday', name: 'الأربعاء' },
  { id: 'thursday', name: 'الخميس' },
  { id: 'friday', name: 'الجمعة' }
];

// أوقات العمل
const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30', '00:00', '00:30', '01:00', '01:30',
  '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30'
];

export default function MerchantRegistrationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = params.phone as string;
  const fullName = params.fullName as string;
  
  // بيانات النموذج
  const [formData, setFormData] = useState({
    fullName: fullName,
    companyName: '',
    storeName: '',
    phoneNumber: phone,
    whatsappNumber: '',
    businessType: '',
    address: '',
    city: '',
    district: '',
    latitude: null as number | null,
    longitude: null as number | null,
    workingDays: [] as string[],
    openingTime: '',
    closingTime: '',
    idImage: null as string | null,
    storeImage: null as string | null,
    wantsAds: false,
    offersDailyDeals: false
  });

  // حالة التطبيق
  const [loading, setLoading] = useState(false);
  const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(false);
  const [showWorkingDaysModal, setShowWorkingDaysModal] = useState(false);
  const [showOpeningTimeModal, setShowOpeningTimeModal] = useState(false);
  const [showClosingTimeModal, setShowClosingTimeModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false);

  // إحداثيات الخريطة
  const [mapRegion, setMapRegion] = useState({
    latitude: 33.3152,
    longitude: 44.3661,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

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

    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
  };

  const getCurrentLocation = async () => {
    if (!locationPermission) {
      Alert.alert('خطأ', 'يجب السماح بالوصول إلى الموقع أولاً');
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('خطأ في تحديد الموقع:', error);
      return null;
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickImage = async (type: string) => {
    try {
      // طلب الأذونات
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'نحتاج إذن للوصول إلى المعرض لاختيار الصور');
        return;
      }

      const imageType = type === 'idImage' ? 'صورة الهوية' : 'صورة المتجر';
      Alert.alert(
        `اختيار ${imageType}`,
        'كيف تريد إضافة الصورة؟',
        [
          {
            text: 'إلغاء',
            style: 'cancel'
          },
          {
            text: 'من المعرض',
            onPress: () => selectImageFromLibrary(type)
          },
          {
            text: 'التقاط صورة',
            onPress: () => takeImageWithCamera(type)
          }
        ]
      );
    } catch (error) {
      console.error('خطأ في اختيار الصورة:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة');
    }
  };

  const selectImageFromLibrary = async (type: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleInputChange(type, result.assets[0].uri);
        console.log(`${type} image selected from library:`, result.assets[0].uri);
      }
    } catch (error) {
      console.error('خطأ في اختيار الصورة من المعرض:', error);
      Alert.alert('خطأ', 'لا يمكن اختيار الصورة من المعرض');
    }
  };

  const takeImageWithCamera = async (type: string) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'نحتاج إذن للوصول إلى الكاميرا لالتقاط الصور');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleInputChange(type, result.assets[0].uri);
        console.log(`${type} image captured with camera:`, result.assets[0].uri);
      }
    } catch (error) {
      console.error('خطأ في التقاط الصورة:', error);
      Alert.alert('خطأ', 'لا يمكن التقاط الصورة');
    }
  };

  const handleWorkingDayToggle = (dayId: string) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(dayId)
        ? prev.workingDays.filter(id => id !== dayId)
        : [...prev.workingDays, dayId]
    }));
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      handleInputChange('latitude', selectedLocation.latitude);
      handleInputChange('longitude', selectedLocation.longitude);
      setShowMapModal(false);
    }
  };

  const goToCurrentLocation = async () => {
    try {
      setCurrentLocationLoading(true);
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        setSelectedLocation(currentLocation);
        handleInputChange('latitude', currentLocation.latitude);
        handleInputChange('longitude', currentLocation.longitude);
        
        const newRegion = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setMapRegion(newRegion);
      }
    } catch (error) {
      console.error('خطأ في الانتقال إلى الموقع الحالي:', error);
      Alert.alert('خطأ', 'لا يمكن الانتقال إلى الموقع الحالي. تأكد من تفعيل خدمة الموقع.');
    } finally {
      setCurrentLocationLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.storeName || !formData.phoneNumber || 
        !formData.businessType || !formData.address || !formData.city || 
        !formData.district || !formData.openingTime || !formData.closingTime) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return false;
    }

    if (formData.workingDays.length === 0) {
      Alert.alert('خطأ', 'يرجى اختيار أيام العمل');
      return false;
    }

    // التحقق من الصور المطلوبة
    if (!formData.idImage) {
      Alert.alert('خطأ', 'يرجى إضافة صورة الهوية (مطلوبة)');
      return false;
    }

    if (!formData.storeImage) {
      Alert.alert('خطأ', 'يرجى إضافة صورة المتجر (مطلوبة)');
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
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              full_name: formData.fullName,
              phone_number: formData.phoneNumber,
              user_type: 'merchant',
              is_approved: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);

        if (createProfileError) {
          console.error('Profile creation error:', createProfileError);
          throw new Error('Failed to create user profile');
        }
      }

      // Upload identity image (required)
      if (!formData.idImage) {
        Alert.alert('خطأ', 'يرجى إضافة صورة الهوية قبل المتابعة');
        return;
      }

      console.log('Uploading identity image...');
      const identityUploadResult = await uploadIdentityImage(formData.idImage, user.id);
      
      let identityImageUrl = null;
      if (identityUploadResult.success && identityUploadResult.url) {
        identityImageUrl = identityUploadResult.url;
        console.log('Identity image uploaded successfully:', identityImageUrl);
      } else {
        console.error('Failed to upload identity image:', identityUploadResult.error);
        Alert.alert('خطأ', 'فشل في رفع صورة الهوية. يرجى المحاولة مرة أخرى أو اختيار صورة أخرى.');
        return;
      }

      // Upload store image (required)
      if (!formData.storeImage) {
        Alert.alert('خطأ', 'يرجى إضافة صورة المتجر قبل المتابعة');
        return;
      }

      console.log('Uploading store image...');
      const storeUploadResult = await uploadMerchantStoreImage(formData.storeImage, user.id);
      
      let storeImageUrl = null;
      if (storeUploadResult.success && storeUploadResult.url) {
        storeImageUrl = storeUploadResult.url;
        console.log('Store image uploaded successfully:', storeImageUrl);
      } else {
        console.error('Failed to upload store image:', storeUploadResult.error);
        Alert.alert('خطأ', 'فشل في رفع صورة المتجر. يرجى المحاولة مرة أخرى أو اختيار صورة أخرى.');
        return;
      }

      // Create merchant record
      const { data, error } = await supabase
        .from('merchants')
        .insert([
          {
            user_id: user.id,
            business_name: formData.storeName,
            business_type: formData.businessType,
            nearest_landmark: formData.address,
            city: formData.city,
            region: formData.district,
            work_days: formData.workingDays.join(','),
            open_time: formData.openingTime,
            close_time: formData.closingTime,
            identity_image: identityImageUrl,
            store_image: storeImageUrl,
            latitude: formData.latitude,
            longitude: formData.longitude,
            abs: formData.wantsAds,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
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
          fullName: formData.fullName
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>اسم الشركة أو المحل *</Text>
                <View style={styles.textInputContainer}>
                  <MaterialIcons name="business" size={20} color="#666" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="أدخل اسم الشركة أو المحل"
                    placeholderTextColor="#999"
                    value={formData.companyName}
                    onChangeText={(text) => handleInputChange('companyName', text)}
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>اسم المتجر أو العلامة التجارية *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل اسم المتجر"
                  placeholderTextColor="#999"
                  value={formData.storeName}
                  onChangeText={(text) => handleInputChange('storeName', text)}
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>رقم الواتساب</Text>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل رقم الواتساب (اختياري)"
                  placeholderTextColor="#999"
                  value={formData.whatsappNumber}
                  onChangeText={(text) => handleInputChange('whatsappNumber', text)}
                  textAlign="right"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>نوع النشاط التجاري *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowBusinessTypeModal(true)}
                >
                  <Text style={[styles.dropdownText, !formData.businessType && styles.placeholderText]}>
                    {formData.businessType || 'اختر نوع النشاط التجاري'}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>العنوان *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="أدخل عنوان المحل أو الشركة"
                  placeholderTextColor="#999"
                  value={formData.address}
                  onChangeText={(text) => handleInputChange('address', text)}
                  textAlign="right"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>المدينة *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل اسم المدينة"
                  placeholderTextColor="#999"
                  value={formData.city}
                  onChangeText={(text) => handleInputChange('city', text)}
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>المنطقة *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل اسم المنطقة"
                  placeholderTextColor="#999"
                  value={formData.district}
                  onChangeText={(text) => handleInputChange('district', text)}
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>تحديد الموقع على الخريطة</Text>
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => setShowMapModal(true)}
                >
                  <MaterialIcons name="location-on" size={20} color="#007AFF" />
                  <Text style={styles.mapButtonText}>
                    {formData.latitude && formData.longitude 
                      ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`
                      : 'اضغط لتحديد الموقع على الخريطة'
                    }
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>أيام العمل *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowWorkingDaysModal(true)}
                >
                  <Text style={[styles.dropdownText, formData.workingDays.length === 0 && styles.placeholderText]}>
                    {formData.workingDays.length > 0 
                      ? `${formData.workingDays.length} يوم محدد`
                      : 'اختر أيام العمل'
                    }
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.timeContainer}>
                <View style={styles.timeInput}>
                  <Text style={styles.label}>وقت الفتح *</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowOpeningTimeModal(true)}
                  >
                    <Text style={[styles.dropdownText, !formData.openingTime && styles.placeholderText]}>
                      {formData.openingTime || 'وقت الفتح'}
                    </Text>
                    <MaterialIcons name="schedule" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.timeInput}>
                  <Text style={styles.label}>وقت الإغلاق *</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowClosingTimeModal(true)}
                  >
                    <Text style={[styles.dropdownText, !formData.closingTime && styles.placeholderText]}>
                      {formData.closingTime || 'وقت الإغلاق'}
                    </Text>
                    <MaterialIcons name="schedule" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>صورة هوية صاحب العمل *</Text>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={() => pickImage('idImage')}
                >
                  {formData.idImage ? (
                    <Image source={{ uri: formData.idImage }} style={styles.selectedImage} />
                  ) : (
                    <>
                      <MaterialIcons name="add-a-photo" size={24} color="#007AFF" />
                      <Text style={styles.imagePickerText}>إضافة صورة الهوية</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>صورة المتجر أو المحل *</Text>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={() => pickImage('storeImage')}
                >
                  {formData.storeImage ? (
                    <Image source={{ uri: formData.storeImage }} style={styles.selectedImage} />
                  ) : (
                    <>
                      <MaterialIcons name="add-a-photo" size={24} color="#007AFF" />
                      <Text style={styles.imagePickerText}>إضافة صورة المتجر</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>



              <View style={styles.inputGroup}>
                <Text style={styles.label}>خيارات الإعلانات</Text>
                
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => handleInputChange('wantsAds', !formData.wantsAds)}
                >
                  <View style={[styles.checkbox, formData.wantsAds && styles.checkboxChecked]}>
                    {formData.wantsAds && <MaterialIcons name="check" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>أرغب في إعلانات داخل التطبيق</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => handleInputChange('offersDailyDeals', !formData.offersDailyDeals)}
                >
                  <View style={[styles.checkbox, formData.offersDailyDeals && styles.checkboxChecked]}>
                    {formData.offersDailyDeals && <MaterialIcons name="check" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>أقدم عروض يومية</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoBox}>
                <MaterialIcons name="info" size={20} color="#007AFF" />
                <Text style={styles.infoText}>
                  ستتم مراجعة طلبك من قبل فريقنا وسيتم التواصل معك قريباً
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <MaterialIcons name="check-circle" size={24} color="#fff" />
                )}
                <Text style={styles.submitButtonText}>
                  {loading ? 'جاري التسجيل...' : 'إكمال التسجيل'}
                </Text>
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

      {/* Modal نوع النشاط التجاري */}
      <Modal
        visible={showBusinessTypeModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر نوع النشاط التجاري</Text>
              <TouchableOpacity onPress={() => setShowBusinessTypeModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {BUSINESS_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.modalOption}
                  onPress={() => {
                    handleInputChange('businessType', type);
                    setShowBusinessTypeModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{type}</Text>
                  {formData.businessType === type && (
                    <MaterialIcons name="check" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal أيام العمل */}
      <Modal
        visible={showWorkingDaysModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر أيام العمل</Text>
              <TouchableOpacity onPress={() => setShowWorkingDaysModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {WORKING_DAYS.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={styles.modalOption}
                  onPress={() => handleWorkingDayToggle(day.id)}
                >
                  <Text style={styles.modalOptionText}>{day.name}</Text>
                  {formData.workingDays.includes(day.id) && (
                    <MaterialIcons name="check" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal وقت الفتح */}
      <Modal
        visible={showOpeningTimeModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر وقت الفتح</Text>
              <TouchableOpacity onPress={() => setShowOpeningTimeModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={styles.modalOption}
                  onPress={() => {
                    handleInputChange('openingTime', time);
                    setShowOpeningTimeModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{time}</Text>
                  {formData.openingTime === time && (
                    <MaterialIcons name="check" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal وقت الإغلاق */}
      <Modal
        visible={showClosingTimeModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر وقت الإغلاق</Text>
              <TouchableOpacity onPress={() => setShowClosingTimeModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={styles.modalOption}
                  onPress={() => {
                    handleInputChange('closingTime', time);
                    setShowClosingTimeModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{time}</Text>
                  {formData.closingTime === time && (
                    <MaterialIcons name="check" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal الخريطة */}
      <Modal
        visible={showMapModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.mapModalOverlay}>
          <View style={styles.mapModalContent}>
            <View style={styles.mapModalHeader}>
              <Text style={styles.mapModalTitle}>تحديد موقع المتجر</Text>
              <TouchableOpacity onPress={() => setShowMapModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
                onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
              >
                {selectedLocation && (
                  <Marker
                    coordinate={selectedLocation}
                    title="موقع المتجر"
                    description="اضغط لتحديد الموقع"
                  />
                )}
              </MapView>
              
              <View style={styles.mapButtons}>
                <TouchableOpacity
                  style={[styles.currentLocationButton, currentLocationLoading && styles.currentLocationButtonLoading]}
                  onPress={goToCurrentLocation}
                  disabled={currentLocationLoading}
                >
                  {currentLocationLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons name="my-location" size={20} color="#fff" />
                  )}
                  <Text style={styles.currentLocationButtonText}>
                    {currentLocationLoading ? 'جاري التحديد...' : 'موقعي الحالي'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelMapButton}
                  onPress={() => setShowMapModal(false)}
                >
                  <Text style={styles.cancelMapButtonText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmMapButton, !selectedLocation && styles.confirmMapButtonDisabled]}
                  onPress={confirmLocation}
                  disabled={!selectedLocation}
                >
                  <Text style={styles.confirmMapButtonText}>تأكيد الموقع</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  merchantContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  merchantIconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  merchantIconBackground: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    top: -20,
    left: -20,
  },
  merchantTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  merchantSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 10,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e9ecef',
    textAlign: 'right',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'right',
  },
  placeholderText: {
    color: '#999',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  mapButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'right',
    marginRight: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  timeInput: {
    flex: 1,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 12,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'right',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'right',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'right',
  },
  mapModalOverlay: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapModalContent: {
    flex: 1,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mapModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#28a745',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  currentLocationButtonLoading: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  currentLocationButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelMapButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#dc3545',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelMapButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  confirmMapButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmMapButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmMapButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 10,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'right',
    marginLeft: 12,
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