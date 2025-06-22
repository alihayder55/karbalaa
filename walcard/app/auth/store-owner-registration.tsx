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

export default function StoreOwnerRegistrationScreen() {
  const router = useRouter();
  const { phone, name } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    nearestLandmark: '',
    storeType: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.address.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال عنوان المحل');
      return false;
    }
    
    if (!formData.storeType.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال نوع المحل');
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

      const { data, error } = await supabase
        .from('store_owners')
        .insert([
          {
            user_id: user.id,
            address: formData.address.trim(),
            nearest_landmark: formData.nearestLandmark.trim() || null,
            store_type: formData.storeType.trim(),
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
          userType: 'store_owner',
          fullName: name as string
        }
      });
    } catch (error: any) {
      console.error('Store owner registration error:', error);
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
                <MaterialIcons name="store" size={48} color="#FF6B35" />
              </View>
              <Text style={styles.title}>تسجيل كصاحب محل</Text>
              <Text style={styles.subtitle}>
                أكمل بيانات محلك التجاري للانضمام كصاحب محل
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>عنوان المحل *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="العنوان الكامل للمحل (الحي، الشارع، رقم البناية)"
                  placeholderTextColor="#999"
                  value={formData.address}
                  onChangeText={(value) => handleInputChange('address', value)}
                  textAlign="right"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>أقرب معلم مميز (اختياري)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="مثال: قرب مجمع النخيل، خلف الجامع الكبير"
                  placeholderTextColor="#999"
                  value={formData.nearestLandmark}
                  onChangeText={(value) => handleInputChange('nearestLandmark', value)}
                  textAlign="right"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>نوع المحل *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="مثال: بقالة، صيدلية، محل ملابس، مطعم"
                  placeholderTextColor="#999"
                  value={formData.storeType}
                  onChangeText={(value) => handleInputChange('storeType', value)}
                  textAlign="right"
                />
              </View>

              <View style={styles.infoBox}>
                <MaterialIcons name="info" size={20} color="#FF6B35" />
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
                  {loading ? 'جاري التسجيل...' : 'تسجيل كصاحب محل'}
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
    backgroundColor: '#fff4f0',
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
    height: 80,
    textAlignVertical: 'top',
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
  submitButton: {
    backgroundColor: '#FF6B35',
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