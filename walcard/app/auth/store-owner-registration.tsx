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
  Linking,
  ActivityIndicator,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, createUser, createStoreOwner, getBusinessTypes, getCities, getWorkingDays } from '../../lib/supabase';
import { checkNetworkConnectivity } from '../../lib/test-connection';
import { uploadStoreImage, uploadIdentityImage } from '../../lib/supabase-storage';

const { width, height } = Dimensions.get('window');

// أنواع النشاط التجاري
const BUSINESS_TYPES = [
  { id: 'supermarket', name: 'سوبرماركت', icon: 'store' },
  { id: 'hypermarket', name: 'هايبر ماركت', icon: 'shopping-cart' },
  { id: 'restaurant', name: 'مطعم', icon: 'restaurant' },
  { id: 'hall', name: 'قاعة', icon: 'event' },
];

// أيام العمل
const WORK_DAYS = [
  { id: 'saturday', name: 'السبت', ar: 'السبت' },
  { id: 'sunday', name: 'الأحد', ar: 'الأحد' },
  { id: 'monday', name: 'الاثنين', ar: 'الاثنين' },
  { id: 'tuesday', name: 'الثلاثاء', ar: 'الثلاثاء' },
  { id: 'wednesday', name: 'الأربعاء', ar: 'الأربعاء' },
  { id: 'thursday', name: 'الخميس', ar: 'الخميس' },
  { id: 'friday', name: 'الجمعة', ar: 'الجمعة' },
];

export default function StoreOwnerRegistrationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = params.phone as string;
  const fullName = params.fullName as string;
  
  // معلومات صاحب المحل
  const [ownerName, setOwnerName] = useState(fullName);
  const [phoneNumbers, setPhoneNumbers] = useState([phone]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  // معلومات المحل
  const [storeName, setStoreName] = useState('');
  const [selectedBusinessType, setSelectedBusinessType] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');
  
  // ساعات العمل
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  
  // صورة المتجر
  const [storeImage, setStoreImage] = useState<string | null>(null);
  
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
    latitude: 33.3152, // إحداثيات العراق (بغداد)
    longitude: 44.3661,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // إنشاء قائمة الساعات
  const generateTimeOptions = () => {
    const times = [];
    // ساعات العمل المعتادة من 6 صباحاً إلى 12 مساءً
    for (let hour = 6; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    // إضافة الساعات من 00:00 إلى 05:30
    for (let hour = 0; hour < 6; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const TIME_OPTIONS = generateTimeOptions();

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

    // طلب إذن الموقع
    requestLocationPermission();
  }, []);

  // طلب إذن الموقع
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      } else {
        setLocationPermission(false);
      }
    } catch (error) {
      console.error('خطأ في طلب إذن الموقع:', error);
      setLocationPermission(false);
    }
  };

  // الحصول على الموقع الحالي
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

  // إضافة رقم هاتف جديد
  const addPhoneNumber = () => {
    if (phoneNumbers.length < 3) {
      setPhoneNumbers([...phoneNumbers, '']);
    }
  };

  // حذف رقم هاتف
  const removePhoneNumber = (index: number) => {
    if (phoneNumbers.length > 1) {
      const newPhoneNumbers = phoneNumbers.filter((_, i) => i !== index);
      setPhoneNumbers(newPhoneNumbers);
    }
  };

  // تحديث رقم هاتف
  const updatePhoneNumber = (index: number, value: string) => {
    const newPhoneNumbers = [...phoneNumbers];
    newPhoneNumbers[index] = value;
    setPhoneNumbers(newPhoneNumbers);
  };

  // اختيار نوع النشاط
  const selectBusinessType = (type: string) => {
    setSelectedBusinessType(type);
    setShowBusinessTypeModal(false);
  };

  // اختيار أيام العمل
  const toggleWorkingDay = (dayId: string) => {
    if (workingDays.includes(dayId)) {
      setWorkingDays(workingDays.filter(day => day !== dayId));
    } else {
      setWorkingDays([...workingDays, dayId]);
    }
  };

  // الحصول على اسم نوع النشاط
  const getBusinessTypeName = (typeId: string) => {
    const type = BUSINESS_TYPES.find(t => t.id === typeId);
    return type ? type.name : '';
  };

  // الحصول على أيام العمل المختارة
  const getWorkingDaysText = () => {
    if (workingDays.length === 0) return 'اختر أيام العمل';
    if (workingDays.length === 7) return 'كل أيام الأسبوع';
    return workingDays.map(dayId => {
      const day = WORK_DAYS.find(d => d.id === dayId);
      return day ? day.ar : '';
    }).join('، ');
  };

  // التحقق من صحة البيانات
  const validateForm = () => {
    if (!ownerName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الاسم الكامل لصاحب المحل');
      return false;
    }
    
    if (phoneNumbers.some(phone => !phone.trim())) {
      Alert.alert('خطأ', 'يرجى إدخال جميع أرقام الهاتف');
      return false;
    }
    
    if (!storeName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المحل التجاري');
      return false;
    }
    
    if (!selectedBusinessType) {
      Alert.alert('خطأ', 'يرجى اختيار نوع النشاط');
      return false;
    }
    
    if (!address.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال العنوان الكامل');
      return false;
    }
    
    if (workingDays.length === 0) {
      Alert.alert('خطأ', 'يرجى اختيار أيام العمل');
      return false;
    }
    
    if (!openingTime.trim() || !closingTime.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال ساعات العمل');
      return false;
    }

    if (!storeImage) {
      Alert.alert('خطأ', 'يرجى إضافة صورة للمتجر (مطلوبة)');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

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
        .from('users')
        .upsert({
          id: user.id,
          full_name: ownerName.trim(),
          phone_number: phoneNumbers[0],
          user_type: 'store_owner',
          is_approved: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile error:', profileError);
      }

      // Upload store image (required)
      if (!storeImage) {
        Alert.alert('خطأ', 'يرجى إضافة صورة للمتجر قبل المتابعة');
        return;
      }

      console.log('Uploading store image...');
      const uploadResult = await uploadStoreImage(storeImage, user.id);
      
      let storeImageUrl = null;
      if (uploadResult.success && uploadResult.url) {
        storeImageUrl = uploadResult.url;
        console.log('Store image uploaded successfully:', storeImageUrl);
      } else {
        console.error('Failed to upload store image:', uploadResult.error);
        Alert.alert('خطأ', 'فشل في رفع صورة المتجر. يرجى المحاولة مرة أخرى أو اختيار صورة أخرى.');
        return;
      }

      // Create store owner record
      const { error: storeOwnerError } = await supabase
        .from('store_owners')
        .insert({
          user_id: user.id,
          store_name: storeName.trim(),
          store_type: selectedBusinessType,
          address: address.trim(),
          nearest_landmark: location.trim(),
          work_days: workingDays.join(','),
          open_time: openingTime.trim(),
          close_time: closingTime.trim(),
          storefront_image: storeImageUrl,
          latitude: selectedLocation?.latitude,
          longitude: selectedLocation?.longitude,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
                fullName: ownerName.trim()
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

  // اختيار وقت الفتح
  const selectOpeningTime = (time: string) => {
    setOpeningTime(time);
    setShowOpeningTimeModal(false);
  };

  // اختيار وقت الإغلاق
  const selectClosingTime = (time: string) => {
    setClosingTime(time);
    setShowClosingTimeModal(false);
  };

  // اختيار موقع على الخريطة
  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
  };

  // تأكيد اختيار الموقع
  const confirmLocation = () => {
    if (selectedLocation) {
      setShowMapModal(false);
    } else {
      Alert.alert('خطأ', 'يرجى اختيار موقع على الخريطة');
    }
  };

  // إعادة تعيين الموقع
  const resetLocation = () => {
    setSelectedLocation(null);
    setLocation('');
  };

  // فتح نافذة الخريطة
  const openMapModal = () => {
    setShowMapModal(true);
  };

  // فتح خريطة Google Maps
  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${mapRegion.latitude},${mapRegion.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('خطأ', 'لا يمكن فتح الخريطة');
    });
  };

  // فتح خريطة لتحديد الإحداثيات
  const openMapForCoordinates = () => {
    Alert.alert(
      'اختيار الموقع',
      'سيتم فتح خريطة Google Maps لاختيار موقع المحل. بعد اختيار الموقع، انسخ الإحداثيات والصقها في الحقل أدناه.',
      [
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'فتح الخريطة',
          onPress: openGoogleMaps
        }
      ]
    );
  };

  // تحديث الإحداثيات يدوياً
  const updateCoordinates = (text: string) => {
    setLocation(text);
    // محاولة تحليل الإحداثيات
    const coords = text.split(',').map(coord => coord.trim());
    if (coords.length === 2) {
      const lat = parseFloat(coords[0]);
      const lng = parseFloat(coords[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setSelectedLocation({ latitude: lat, longitude: lng });
      }
    }
  };

  // إضافة زر لتحديد الموقع الفعلي والانتقال إليه في واجهة الخريطة
  const goToCurrentLocation = async () => {
    try {
      setCurrentLocationLoading(true);
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        // تحديث الموقع المحدد
        setSelectedLocation(currentLocation);
        setLocation(`${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`);
        
        // تحديث منطقة الخريطة للانتقال للموقع الحالي
        const newRegion = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setMapRegion(newRegion);
        
        console.log('تم الانتقال إلى الموقع الحالي:', currentLocation);
      }
    } catch (error) {
      console.error('خطأ في الانتقال إلى الموقع الحالي:', error);
      Alert.alert('خطأ', 'لا يمكن الانتقال إلى الموقع الحالي. تأكد من تفعيل خدمة الموقع.');
    } finally {
      setCurrentLocationLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // طلب الأذونات
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'نحتاج إذن للوصول إلى المعرض لاختيار الصور');
        return;
      }

      Alert.alert(
        'اختيار صورة المتجر',
        'كيف تريد إضافة الصورة؟',
        [
          {
            text: 'إلغاء',
            style: 'cancel'
          },
          {
            text: 'من المعرض',
            onPress: () => selectImageFromLibrary()
          },
          {
            text: 'التقاط صورة',
            onPress: () => takeImageWithCamera()
          }
        ]
      );
    } catch (error) {
      console.error('خطأ في اختيار الصورة:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة');
    }
  };

  const selectImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setStoreImage(result.assets[0].uri);
        console.log('Store image selected from library:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('خطأ في اختيار الصورة من المعرض:', error);
      Alert.alert('خطأ', 'لا يمكن اختيار الصورة من المعرض');
    }
  };

  const takeImageWithCamera = async () => {
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
        setStoreImage(result.assets[0].uri);
        console.log('Store image captured with camera:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('خطأ في التقاط الصورة:', error);
      Alert.alert('خطأ', 'لا يمكن التقاط الصورة');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    // تحديث البيانات حسب نوع الحقل
    switch (field) {
      case 'fullName':
        setOwnerName(value);
        break;
      case 'companyName':
        // إضافة حالة للشركة إذا لزم الأمر
        break;
      case 'storeName':
        setStoreName(value);
        break;
      case 'phoneNumber':
        // تحديث رقم الهاتف الأول
        const newPhoneNumbers = [...phoneNumbers];
        newPhoneNumbers[0] = value;
        setPhoneNumbers(newPhoneNumbers);
        break;
      case 'whatsappNumber':
        setWhatsappNumber(value);
        break;
      case 'businessType':
        setSelectedBusinessType(value);
        break;
      case 'address':
        setAddress(value);
        break;
      case 'city':
        // إضافة حالة للمدينة إذا لزم الأمر
        break;
      case 'district':
        // إضافة حالة للمنطقة إذا لزم الأمر
        break;
      case 'idImage':
        // إضافة حالة للصور إذا لزم الأمر
        break;
      default:
        break;
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
              {/* معلومات صاحب المحل */}
              <View style={styles.section}>
                <View style={styles.sectionTitle}>
                  <MaterialIcons name="person" size={24} color="#FF6B35" />
                  <Text style={styles.sectionTitleText}>معلومات صاحب المحل</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>الاسم الكامل لصاحب المحل *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="أدخل الاسم الكامل"
                    placeholderTextColor="#999"
                    value={ownerName}
                    onChangeText={setOwnerName}
                    textAlign="right"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>أرقام الهاتف *</Text>
                  {phoneNumbers.map((phoneNumber, index) => (
                    <View key={index} style={styles.phoneInputRow}>
                      <MaterialIcons name="phone" size={20} color="#666" />
                      <TextInput
                        style={styles.phoneInput}
                        placeholder={`رقم الهاتف ${index + 1}`}
                        placeholderTextColor="#999"
                        value={phoneNumber}
                        onChangeText={(value) => updatePhoneNumber(index, value)}
                        keyboardType="phone-pad"
                        textAlign="right"
                      />
                      {phoneNumbers.length > 1 && (
                        <TouchableOpacity
                          style={styles.removePhoneButton}
                          onPress={() => removePhoneNumber(index)}
                        >
                          <MaterialIcons name="remove-circle" size={24} color="#dc3545" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  {phoneNumbers.length < 3 && (
                    <TouchableOpacity
                      style={styles.addPhoneButton}
                      onPress={addPhoneNumber}
                    >
                      <MaterialIcons name="add-circle" size={20} color="#fff" />
                      <Text style={styles.addPhoneText}>إضافة رقم هاتف آخر</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>رقم الواتساب (اختياري)</Text>
                  <View style={styles.whatsappInputContainer}>
                    <MaterialIcons name="chat" size={20} color="#25D366" />
                    <TextInput
                      style={styles.whatsappInput}
                      placeholder="أدخل رقم الواتساب"
                      placeholderTextColor="#999"
                      value={whatsappNumber}
                      onChangeText={setWhatsappNumber}
                      keyboardType="phone-pad"
                      textAlign="right"
                    />
                  </View>
                </View>
              </View>

              {/* معلومات المحل */}
              <View style={styles.section}>
                <View style={styles.sectionTitle}>
                  <MaterialIcons name="store" size={24} color="#FF6B35" />
                  <Text style={styles.sectionTitleText}>معلومات المحل</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>اسم المحل التجاري *</Text>
                  <View style={styles.inputWithIcon}>
                    <MaterialIcons name="store" size={20} color="#666" />
                    <TextInput
                      style={styles.inputWithIconText}
                      placeholder="أدخل اسم المحل"
                      placeholderTextColor="#999"
                      value={storeName}
                      onChangeText={setStoreName}
                      textAlign="right"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>نوع النشاط *</Text>
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setShowBusinessTypeModal(true)}
                  >
                    <Text style={selectedBusinessType ? styles.selectorText : styles.selectorPlaceholder}>
                      {selectedBusinessType ? getBusinessTypeName(selectedBusinessType) : 'اختر نوع النشاط'}
                    </Text>
                    <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>العنوان الكامل *</Text>
                  <View style={styles.inputWithIcon}>
                    <MaterialIcons name="location-on" size={20} color="#666" />
                    <TextInput
                      style={[styles.inputWithIconText, styles.textArea]}
                      placeholder="أدخل العنوان الكامل للمحل"
                      placeholderTextColor="#999"
                      value={address}
                      onChangeText={setAddress}
                      textAlign="right"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>الموقع على الخريطة (اختياري)</Text>
                  <View style={styles.locationContainer}>
                    <TextInput
                      style={styles.locationInput}
                      placeholder="اضغط لاختيار الموقع على الخريطة"
                      placeholderTextColor="#999"
                      value={location}
                      editable={false}
                      textAlign="right"
                    />
                    <TouchableOpacity
                      style={styles.mapButton}
                      onPress={openMapModal}
                    >
                      <MaterialIcons name="map" size={24} color="#FF6B35" />
                    </TouchableOpacity>
                  </View>
                  {location && (
                    <TouchableOpacity
                      style={styles.resetLocationButton}
                      onPress={resetLocation}
                    >
                      <MaterialIcons name="clear" size={16} color="#dc3545" />
                      <Text style={styles.resetLocationText}>إعادة تعيين الموقع</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* ساعات العمل */}
              <View style={styles.section}>
                <View style={styles.sectionTitle}>
                  <MaterialIcons name="schedule" size={24} color="#FF6B35" />
                  <Text style={styles.sectionTitleText}>ساعات العمل</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>أيام العمل *</Text>
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setShowWorkingDaysModal(true)}
                  >
                    <Text style={workingDays.length > 0 ? styles.selectorText : styles.selectorPlaceholder}>
                      {getWorkingDaysText()}
                    </Text>
                    <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.timeContainer}>
                  <View style={styles.timeInput}>
                    <Text style={styles.inputLabel}>وقت الفتح *</Text>
                    <TouchableOpacity
                      style={styles.selector}
                      onPress={() => setShowOpeningTimeModal(true)}
                    >
                      <Text style={openingTime ? styles.selectorText : styles.selectorPlaceholder}>
                        {openingTime || '9:00'}
                      </Text>
                      <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timeInput}>
                    <Text style={styles.inputLabel}>وقت الإغلاق *</Text>
                    <TouchableOpacity
                      style={styles.selector}
                      onPress={() => setShowClosingTimeModal(true)}
                    >
                      <Text style={closingTime ? styles.selectorText : styles.selectorPlaceholder}>
                        {closingTime || '22:00'}
                      </Text>
                      <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* صورة المتجر */}
              <View style={styles.section}>
                <View style={styles.sectionTitle}>
                  <MaterialIcons name="photo-camera" size={24} color="#FF6B35" />
                  <Text style={styles.sectionTitleText}>صورة المتجر</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>صورة واجهة المتجر *</Text>
                  <Text style={styles.inputDescription}>
                    أضف صورة لواجهة المتجر لمساعدة العملاء في التعرف على موقعك (مطلوبة)
                  </Text>
                  <TouchableOpacity
                    style={styles.imagePickerButton}
                    onPress={pickImage}
                  >
                    {storeImage ? (
                      <View style={styles.selectedImageContainer}>
                        <Image source={{ uri: storeImage }} style={styles.selectedImage} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => setStoreImage(null)}
                        >
                          <MaterialIcons name="close" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.imagePickerContent}>
                        <MaterialIcons name="add-a-photo" size={40} color="#FF6B35" />
                        <Text style={styles.imagePickerText}>إضافة صورة المتجر</Text>
                        <Text style={styles.imagePickerSubtext}>
                          اضغط لاختيار من المعرض أو التقاط صورة جديدة
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <View style={styles.submitButtonContent}>
                  <MaterialIcons 
                    name={loading ? "hourglass-empty" : "check-circle"} 
                    size={24} 
                    color="#fff" 
                  />
                  <Text style={styles.submitButtonText}>
                    {loading ? 'جاري التسجيل...' : 'تسجيل المحل'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal اختيار نوع النشاط */}
      <Modal
        visible={showBusinessTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBusinessTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر نوع النشاط</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowBusinessTypeModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {BUSINESS_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalItem,
                    selectedBusinessType === type.id && styles.selectedModalItem
                  ]}
                  onPress={() => selectBusinessType(type.id)}
                >
                  <View style={styles.modalItemContent}>
                    <MaterialIcons name={type.icon as any} size={24} color="#FF6B35" />
                    <Text style={styles.modalItemText}>{type.name}</Text>
                  </View>
                  {selectedBusinessType === type.id && (
                    <MaterialIcons name="check" size={20} color="#FF6B35" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal اختيار أيام العمل */}
      <Modal
        visible={showWorkingDaysModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkingDaysModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر أيام العمل</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowWorkingDaysModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {WORK_DAYS.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.modalItem,
                    workingDays.includes(day.id) && styles.selectedModalItem
                  ]}
                  onPress={() => toggleWorkingDay(day.id)}
                >
                  <View style={styles.modalItemContent}>
                    <MaterialIcons name="event" size={24} color="#FF6B35" />
                    <Text style={styles.modalItemText}>{day.ar}</Text>
                  </View>
                  {workingDays.includes(day.id) && (
                    <MaterialIcons name="check" size={20} color="#FF6B35" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal اختيار وقت الفتح */}
      <Modal
        visible={showOpeningTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOpeningTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <MaterialIcons name="schedule" size={24} color="#FF6B35" />
                <Text style={styles.modalTitle}>اختر وقت الفتح</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowOpeningTimeModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.modalItem,
                    openingTime === time && styles.selectedModalItem
                  ]}
                  onPress={() => selectOpeningTime(time)}
                >
                  <View style={styles.modalItemContent}>
                    <MaterialIcons name="schedule" size={20} color="#FF6B35" />
                    <Text style={styles.modalItemText}>{time}</Text>
                  </View>
                  {openingTime === time && (
                    <MaterialIcons name="check" size={20} color="#FF6B35" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal اختيار وقت الإغلاق */}
      <Modal
        visible={showClosingTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClosingTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <MaterialIcons name="schedule" size={24} color="#FF6B35" />
                <Text style={styles.modalTitle}>اختر وقت الإغلاق</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowClosingTimeModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.modalItem,
                    closingTime === time && styles.selectedModalItem
                  ]}
                  onPress={() => selectClosingTime(time)}
                >
                  <View style={styles.modalItemContent}>
                    <MaterialIcons name="schedule" size={20} color="#FF6B35" />
                    <Text style={styles.modalItemText}>{time}</Text>
                  </View>
                  {closingTime === time && (
                    <MaterialIcons name="check" size={20} color="#FF6B35" />
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
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <SafeAreaView style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <View style={styles.mapTitleContainer}>
              <MaterialIcons name="map" size={24} color="#FF6B35" />
              <Text style={styles.mapTitle}>اختر موقع المحل</Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowMapModal(false)}
            >
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mapContainer}>
            {MapView ? (
              <MapView
                style={styles.map}
                region={mapRegion}
                onPress={handleMapPress}
                showsUserLocation={locationPermission}
                showsMyLocationButton={false}
                showsCompass={true}
                showsScale={true}
                showsBuildings={true}
                showsTraffic={false}
                mapType="standard"
                onRegionChangeComplete={(region: any) => {
                  console.log('تم تغيير منطقة الخريطة:', region);
                }}
              >
                {selectedLocation && (
                  <Marker
                    coordinate={selectedLocation}
                    title="موقع المحل"
                    description="الموقع المختار"
                    pinColor="#FF6B35"
                  />
                )}
              </MapView>
            ) : (
              <View style={styles.mapErrorContainer}>
                <MaterialIcons name="error" size={64} color="#dc3545" />
                <Text style={styles.mapErrorTitle}>خطأ في تحميل الخريطة</Text>
                <Text style={styles.mapErrorText}>
                  لا يمكن تحميل الخريطة في الوقت الحالي. يرجى المحاولة مرة أخرى لاحقاً.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => setShowMapModal(false)}
                >
                  <Text style={styles.retryButtonText}>إغلاق</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={styles.mapFooter}>
            <Text style={styles.mapInstructions}>
              اضغط على الخريطة لاختيار موقع المحل
            </Text>
            {selectedLocation && (
              <Text style={styles.selectedCoordinates}>
                الإحداثيات: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </Text>
            )}
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
        </SafeAreaView>
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
    marginBottom: 30,
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
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
  section: {
    marginBottom: 30,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
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
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    color: '#333',
    textAlign: 'right',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  removePhoneButton: {
    padding: 8,
  },
  addPhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#28a745',
    borderRadius: 12,
    marginTop: 10,
  },
  addPhoneText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: '#999',
    textAlign: 'right',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  timeInput: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedModalItem: {
    backgroundColor: '#fff4f0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    textAlign: 'right',
  },
  whatsappInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 16,
  },
  whatsappInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 16,
  },
  inputWithIconText: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 16,
  },
  locationInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  mapButton: {
    padding: 8,
  },
  resetLocationButton: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetLocationText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  mapTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapFooter: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  mapInstructions: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  selectedCoordinates: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
  },
  mapButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLocationButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  currentLocationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelMapButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  cancelMapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmMapButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  confirmMapButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  confirmMapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapErrorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  mapErrorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  currentLocationButtonLoading: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  imagePickerButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  imagePickerSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  inputDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'right',
    lineHeight: 20,
  },
  selectedImageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedImage: {
    width: 150,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#dc3545',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
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
    color: '#333',
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  placeholderText: {
    color: '#999',
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
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mapButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
}); 