import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function UserTypeSelectionScreen() {
  const router = useRouter();
  const { phone, name } = useLocalSearchParams();

  const handleMerchantSelection = () => {
    router.push({
      pathname: '/auth/merchant-registration',
      params: { phone, name }
    });
  };

  const handleStoreOwnerSelection = () => {
    router.push({
      pathname: '/auth/store-owner-registration',
      params: { phone, name }
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>اختر نوع حسابك</Text>
            <Text style={styles.subtitle}>
              حدد نوع النشاط التجاري الخاص بك
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            {/* Merchant Option */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={handleMerchantSelection}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="business" size={48} color="#007AFF" />
              </View>
              <Text style={styles.optionTitle}>تاجر</Text>
              <Text style={styles.optionDescription}>
                أملك شركة أو مؤسسة تجارية وأريد بيع منتجاتي للمحلات
              </Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <MaterialIcons name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.featureText}>عرض المنتجات</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialIcons name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.featureText}>إدارة المخزون</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialIcons name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.featureText}>تتبع الطلبات</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Store Owner Option */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={handleStoreOwnerSelection}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="store" size={48} color="#FF6B35" />
              </View>
              <Text style={styles.optionTitle}>صاحب محل</Text>
              <Text style={styles.optionDescription}>
                أملك محل تجاري وأريد شراء المنتجات من التجار
              </Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <MaterialIcons name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.featureText}>تصفح المنتجات</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialIcons name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.featureText}>طلب المنتجات</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialIcons name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.featureText}>إدارة المشتريات</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={20} color="#666" />
            <Text style={styles.backButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  optionsContainer: {
    gap: 20,
    marginBottom: 40,
  },
  optionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  featuresList: {
    alignItems: 'flex-start',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#555',
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