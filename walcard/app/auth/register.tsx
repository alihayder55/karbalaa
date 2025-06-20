import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import PhoneNumberInput from 'react-native-phone-number-input';

export default function RegisterScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const [name, setName] = useState('');
  const phoneInput = useRef<PhoneNumberInput>(null);

  const handleRegister = () => {
    // TODO: Implement phone number verification and registration
    console.log('Name:', name);
    console.log('Phone Number:', phoneNumber);
    console.log('Formatted Value:', formattedValue);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>إنشاء حساب جديد</Text>
        <Text style={styles.subtitle}>أدخل بياناتك للبدء</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="الاسم الكامل"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            textAlign="right"
          />

          <View style={styles.phoneInputContainer}>
            <PhoneNumberInput
              ref={phoneInput}
              defaultValue={phoneNumber}
              defaultCode="SA"
              layout="first"
              onChangeText={(text) => {
                setPhoneNumber(text);
              }}
              onChangeFormattedText={(text) => {
                setFormattedValue(text);
              }}
              withDarkTheme={false}
              withShadow
              containerStyle={styles.phoneInput}
              textContainerStyle={styles.phoneInputText}
              textInputStyle={styles.phoneInputTextInput}
              codeTextStyle={styles.phoneInputCodeText}
            />
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={handleRegister}
          >
            <Text style={styles.buttonText}>متابعة</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.linkText}>لديك حساب بالفعل؟ سجل دخولك</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    gap: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  phoneInputContainer: {
    width: '100%',
  },
  phoneInput: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  phoneInputText: {
    backgroundColor: 'transparent',
  },
  phoneInputTextInput: {
    fontSize: 16,
    textAlign: 'right',
  },
  phoneInputCodeText: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
}); 