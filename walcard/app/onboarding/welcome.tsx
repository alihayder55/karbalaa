import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Logo or App Icon */}
      <View style={styles.imageContainer}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="store" size={80} color="#007AFF" />
        </View>
      </View>

      {/* Welcome Text */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>مرحباً بك في ولكارد</Text>
        <Text style={styles.subtitle}>منصة التجارة بالجملة الذكية</Text>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <MaterialIcons name="handshake" size={20} color="#007AFF" />
            <Text style={styles.featureText}>تواصل مباشر مع التجار</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="price-check" size={20} color="#007AFF" />
            <Text style={styles.featureText}>أسعار تنافسية بدون وسيط</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="local-shipping" size={20} color="#007AFF" />
            <Text style={styles.featureText}>توصيل سريع وموثوق</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="dashboard" size={20} color="#007AFF" />
            <Text style={styles.featureText}>إدارة طلباتك بسهولة</Text>
          </View>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/auth/unified-auth')}
        >
          <MaterialIcons name="login" size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>ابدأ الآن</Text>
        </TouchableOpacity>
        
        <Text style={styles.helpText}>
          سيتم التحقق من رقم هاتفك لتسجيل الدخول أو إنشاء حساب جديد
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  imageContainer: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textContainer: {
    flex: 0.4,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#444',
    marginLeft: 12,
    textAlign: 'right',
    lineHeight: 24,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
}); 