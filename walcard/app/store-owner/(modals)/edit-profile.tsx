import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { getCurrentUser } from '../../../lib/auth-helpers';

interface StoreOwner {
  user_id: string;
  full_name: string;
  company_name?: string;
  store_name: string;
  phone_number: string;
  whatsapp_number?: string;
  store_type: string;
  business_type: string;
  address: string;
  city: string;
  district: string;
  nearest_landmark: string;
  working_days: string[];
  opening_time: string;
  closing_time: string;
  storefront_image?: string;
  is_approved: boolean;
}

export default function StoreOwnerEditProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeOwner, setStoreOwner] = useState<StoreOwner | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    store_name: '',
    phone_number: '',
    whatsapp_number: '',
    store_type: '',
    business_type: '',
    address: '',
    city: '',
    district: '',
    nearest_landmark: '',
    opening_time: '',
    closing_time: '',
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Get current user from session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        Alert.alert('خطأ', 'لم يتم العثور على المستخدم');
        router.push('/store-owner');
        return;
      }

      const { data, error } = await supabase
        .from('store_owners')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        Alert.alert('خطأ', 'حدث خطأ أثناء تحميل البيانات');
        return;
      }

      setStoreOwner(data);
      setFormData({
        full_name: data.full_name || '',
        company_name: data.company_name || '',
        store_name: data.store_name || '',
        phone_number: data.phone_number || '',
        whatsapp_number: data.whatsapp_number || '',
        store_type: data.store_type || '',
        business_type: data.business_type || '',
        address: data.address || '',
        city: data.city || '',
        district: data.district || '',
        nearest_landmark: data.nearest_landmark || '',
        opening_time: data.opening_time || '',
        closing_time: data.closing_time || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validation
      if (!formData.full_name.trim()) {
        Alert.alert('خطأ', 'الاسم الكامل مطلوب');
        return;
      }
      if (!formData.store_name.trim()) {
        Alert.alert('خطأ', 'اسم المحل مطلوب');
        return;
      }
      if (!formData.phone_number.trim()) {
        Alert.alert('خطأ', 'رقم الهاتف مطلوب');
        return;
      }

      // Get current user from session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        Alert.alert('خطأ', 'لم يتم العثور على المستخدم');
        return;
      }

      const { error } = await supabase
        .from('store_owners')
        .update({
          full_name: formData.full_name.trim(),
          company_name: formData.company_name.trim(),
          store_name: formData.store_name.trim(),
          phone_number: formData.phone_number.trim(),
          whatsapp_number: formData.whatsapp_number.trim(),
          store_type: formData.store_type.trim(),
          business_type: formData.business_type.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          district: formData.district.trim(),
          nearest_landmark: formData.nearest_landmark.trim(),
          opening_time: formData.opening_time.trim(),
          closing_time: formData.closing_time.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert('خطأ', 'حدث خطأ أثناء حفظ البيانات');
        return;
      }

      Alert.alert('نجح', 'تم حفظ البيانات بنجاح');
      router.push('/store-owner');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#40E0D0" />
          <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/store-owner')}>
          <MaterialIcons name="arrow-back" size={24} color="#40E0D0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تعديل الملف الشخصي</Text>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={saving}
        >
          <MaterialIcons name="save" size={20} color="#40E0D0" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            {storeOwner?.storefront_image ? (
              <Image
                source={{ uri: storeOwner.storefront_image }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="store" size={40} color="#666" />
              </View>
            )}
            <TouchableOpacity style={styles.editImageButton}>
              <MaterialIcons name="camera-alt" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.imageText}>صورة المحل</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={20} color="#40E0D0" />
            <Text style={styles.sectionTitle}>المعلومات الشخصية</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>الاسم الكامل *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.full_name}
              onChangeText={(text) => setFormData({...formData, full_name: text})}
              placeholder="أدخل الاسم الكامل"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>اسم الشركة</Text>
            <TextInput
              style={styles.textInput}
              value={formData.company_name}
              onChangeText={(text) => setFormData({...formData, company_name: text})}
              placeholder="أدخل اسم الشركة"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Store Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="store" size={20} color="#40E0D0" />
            <Text style={styles.sectionTitle}>معلومات المحل</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>اسم المحل *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.store_name}
              onChangeText={(text) => setFormData({...formData, store_name: text})}
              placeholder="أدخل اسم المحل"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>نوع المحل</Text>
            <TextInput
              style={styles.textInput}
              value={formData.store_type}
              onChangeText={(text) => setFormData({...formData, store_type: text})}
              placeholder="أدخل نوع المحل"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>نوع النشاط التجاري</Text>
            <TextInput
              style={styles.textInput}
              value={formData.business_type}
              onChangeText={(text) => setFormData({...formData, business_type: text})}
              placeholder="أدخل نوع النشاط التجاري"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="contact-phone" size={20} color="#40E0D0" />
            <Text style={styles.sectionTitle}>معلومات التواصل</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>رقم الهاتف *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.phone_number}
              onChangeText={(text) => setFormData({...formData, phone_number: text})}
              placeholder="أدخل رقم الهاتف"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>رقم الواتساب</Text>
            <TextInput
              style={styles.textInput}
              value={formData.whatsapp_number}
              onChangeText={(text) => setFormData({...formData, whatsapp_number: text})}
              placeholder="أدخل رقم الواتساب"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Address Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="location-on" size={20} color="#40E0D0" />
            <Text style={styles.sectionTitle}>معلومات العنوان</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>العنوان *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.address}
              onChangeText={(text) => setFormData({...formData, address: text})}
              placeholder="أدخل العنوان"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.inputLabel}>المدينة</Text>
              <TextInput
                style={styles.textInput}
                value={formData.city}
                onChangeText={(text) => setFormData({...formData, city: text})}
                placeholder="المدينة"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.inputLabel}>المنطقة</Text>
              <TextInput
                style={styles.textInput}
                value={formData.district}
                onChangeText={(text) => setFormData({...formData, district: text})}
                placeholder="المنطقة"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>أقرب معلم</Text>
            <TextInput
              style={styles.textInput}
              value={formData.nearest_landmark}
              onChangeText={(text) => setFormData({...formData, nearest_landmark: text})}
              placeholder="أدخل أقرب معلم"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Working Hours */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="schedule" size={20} color="#40E0D0" />
            <Text style={styles.sectionTitle}>أوقات العمل</Text>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.inputLabel}>وقت الفتح</Text>
              <TextInput
                style={styles.textInput}
                value={formData.opening_time}
                onChangeText={(text) => setFormData({...formData, opening_time: text})}
                placeholder="08:00"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.inputLabel}>وقت الإغلاق</Text>
              <TextInput
                style={styles.textInput}
                value={formData.closing_time}
                onChangeText={(text) => setFormData({...formData, closing_time: text})}
                placeholder="22:00"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveProfileButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <View style={styles.buttonContent}>
            <MaterialIcons 
              name={saving ? "hourglass-empty" : "save"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.buttonText}>
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#40E0D0',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  inputGroup: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  saveProfileButton: {
    backgroundColor: '#40E0D0',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#40E0D0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
}); 