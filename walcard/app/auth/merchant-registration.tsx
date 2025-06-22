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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function MerchantRegistrationScreen() {
  const router = useRouter();
  const { phone, name } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
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
      // تحويل المنتجات إلى مصفوفة
      const productsArray = formData.availableProducts
        .split(',')
        .map(product => product.trim())
        .filter(product => product.length > 0);

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

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
          fullName: name as string
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
              <View style={styles.iconContainer}>
                <MaterialIcons name="business" size={48} color="#007AFF" />
              </View>
              <Text style={styles.title}>تسجيل كتاجر</Text>
              <Text style={styles.subtitle}>
                أكمل بياناتك التجارية للانضمام كتاجر
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>اسم النشاط التجاري *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="اسم الشركة أو المؤسسة التجارية"
                  placeholderTextColor="#999"
                  value={formData.businessName}
                  onChangeText={(value) => handleInputChange('businessName', value)}
                  textAlign="right"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>رقم غرفة التجارة (اختياري)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="رقم السجل التجاري أو غرفة التجارة"
                  placeholderTextColor="#999"
                  value={formData.chamberOfCommerceId}
                  onChangeText={(value) => handleInputChange('chamberOfCommerceId', value)}
                  textAlign="right"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>المنتجات المتاحة *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="اكتب المنتجات مفصولة بفواصل (مثال: ملابس، أحذية، إكسسوارات)"
                  placeholderTextColor="#999"
                  value={formData.availableProducts}
                  onChangeText={(value) => handleInputChange('availableProducts', value)}
                  textAlign="right"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.infoBox}>
                <MaterialIcons name="info" size={20} color="#007AFF" />
                <Text style={styles.infoText}>
                  سيتم مراجعة طلب التسجيل خلال 24-48 ساعة. ستتلقى إشعاراً عند الموافقة.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'جاري التسجيل...' : 'تسجيل كتاجر'}
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  formContainer: {
    width: '100%',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
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