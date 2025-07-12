import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function StoreOwnerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          marginTop: 1,
        },
        tabBarIconStyle: {
          marginBottom: 1,
        },
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: 'الطلبات',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="receipt" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'البحث',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="search" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'المفضلة',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="favorite" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'الملف الشخصي',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={22} color={color} />
          ),
        }}
      />
      
      {/* Hide cart and modal screens from tab bar */}
      <Tabs.Screen
        name="cart"
        options={{
          href: null, // This moves cart out of tabs
        }}
      />
      <Tabs.Screen
        name="(modals)"
        options={{
          href: null, // This hides the entire (modals) group from tabs
        }}
      />
    </Tabs>
  );
} 