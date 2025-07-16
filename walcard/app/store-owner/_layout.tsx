import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform, View, Animated, BackHandler } from 'react-native';
import { useEffect, useRef } from 'react';

export default function StoreOwnerLayout() {
  // إنشاء متغيرات للحركة لكل تبويب
  const animatedValues = {
    orders: useRef(new Animated.Value(0)).current,
    search: useRef(new Animated.Value(0)).current,
    index: useRef(new Animated.Value(0)).current,
    favorites: useRef(new Animated.Value(0)).current,
    profile: useRef(new Animated.Value(0)).current,
  };

  // دالة لتحريك التبويب المحدد
  const animateTab = (tabName: string, isFocused: boolean) => {
    const animations = Object.keys(animatedValues).map(key => {
      const targetValue = key === tabName && isFocused ? 1 : 0;
      return Animated.timing(animatedValues[key as keyof typeof animatedValues], {
        toValue: targetValue,
        duration: 400,
        useNativeDriver: true,
      });
    });

    Animated.parallel(animations).start();
  };

  // إضافة مستمع للزر الخلفي
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // العودة للصفحة الرئيسية بدلاً من الخروج من التطبيق
      return true; // منع الخروج من التطبيق
    });

    return () => backHandler.remove();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 80 : 70,
          paddingBottom: Platform.OS === 'ios' ? 15 : 10,
          paddingTop: 10,
          paddingHorizontal: 15,
          marginHorizontal: 25,
          marginBottom: 20,
          borderRadius: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 15,
          position: 'absolute',
          bottom: 0,
          left: 25,
          right: 25,
        },
        tabBarActiveTintColor: '#40E0D0',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          display: 'none', // إخفاء أسماء التبويبات
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        tabBarIcon: ({ focused, color, size }) => {
          return (
            <View style={{ position: 'relative' }}>
              {/* تجويف شفاف للتبويب المحدد */}
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: -8,
                    right: -8,
                    bottom: -12,
                    backgroundColor: 'transparent',
                    borderRadius: 30,
                    borderWidth: 0,
                    shadowColor: 'transparent',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0,
                    shadowRadius: 0,
                    elevation: 0,
                  }}
                />
              )}
              
              <Animated.View
                style={{
                  width: 45,
                  height: 45,
                  borderRadius: 22.5,
                  backgroundColor: focused ? '#40E0D0' : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 0,
                  transform: [
                    {
                      translateY: animatedValues.index.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -12],
                      }),
                    },
                    {
                      scale: animatedValues.index.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.12],
                      }),
                    },
                  ],
                  shadowColor: focused ? '#40E0D0' : 'transparent',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: focused ? 0.4 : 0,
                  shadowRadius: 12,
                  elevation: focused ? 15 : 0,
                  zIndex: focused ? 10 : 1,
                }}
              >
                <MaterialIcons 
                  name="home" 
                  size={focused ? 24 : 20} 
                  color={focused ? '#fff' : color} 
                />
              </Animated.View>
            </View>
          );
        },
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: '',
          tabBarIcon: ({ focused, color, size }) => {
            useEffect(() => {
              animateTab('orders', focused);
            }, [focused]);

            return (
              <View style={{ position: 'relative' }}>
                {/* تجويف شفاف للتبويب المحدد */}
                {focused && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: -8,
                      right: -8,
                      bottom: -12,
                      backgroundColor: 'transparent',
                      borderRadius: 30,
                      borderWidth: 0,
                      shadowColor: 'transparent',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0,
                      shadowRadius: 0,
                      elevation: 0,
                    }}
                  />
                )}
                
                <Animated.View
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: 22.5,
                    backgroundColor: focused ? '#40E0D0' : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 0,
                    transform: [
                      {
                        translateY: animatedValues.orders.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -12],
                        }),
                      },
                      {
                        scale: animatedValues.orders.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.12],
                        }),
                      },
                    ],
                    shadowColor: focused ? '#40E0D0' : 'transparent',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: focused ? 0.4 : 0,
                    shadowRadius: 12,
                    elevation: focused ? 15 : 0,
                    zIndex: focused ? 10 : 1,
                  }}
                >
                  <MaterialIcons 
                    name="receipt" 
                    size={focused ? 24 : 20} 
                    color={focused ? '#fff' : color} 
                  />
                </Animated.View>
              </View>
            );
          },
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: '',
          tabBarIcon: ({ focused, color, size }) => {
            useEffect(() => {
              animateTab('search', focused);
            }, [focused]);

            return (
              <View style={{ position: 'relative' }}>
                {/* تجويف شفاف للتبويب المحدد */}
                {focused && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: -8,
                      right: -8,
                      bottom: -12,
                      backgroundColor: 'transparent',
                      borderRadius: 30,
                      borderWidth: 0,
                      shadowColor: 'transparent',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0,
                      shadowRadius: 0,
                      elevation: 0,
                    }}
                  />
                )}
                
                <Animated.View
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: 22.5,
                    backgroundColor: focused ? '#40E0D0' : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 0,
                    transform: [
                      {
                        translateY: animatedValues.search.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -12],
                        }),
                      },
                      {
                        scale: animatedValues.search.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.12],
                        }),
                      },
                    ],
                    shadowColor: focused ? '#40E0D0' : 'transparent',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: focused ? 0.4 : 0,
                    shadowRadius: 12,
                    elevation: focused ? 15 : 0,
                    zIndex: focused ? 10 : 1,
                  }}
                >
                  <MaterialIcons 
                    name="search" 
                    size={focused ? 24 : 20} 
                    color={focused ? '#fff' : color} 
                  />
                </Animated.View>
              </View>
            );
          },
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ focused, color, size }) => {
            useEffect(() => {
              animateTab('index', focused);
            }, [focused]);

            return (
              <View style={{ position: 'relative' }}>
                {/* تجويف شفاف للتبويب المحدد */}
                {focused && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: -8,
                      right: -8,
                      bottom: -12,
                      backgroundColor: 'transparent',
                      borderRadius: 30,
                      borderWidth: 0,
                      shadowColor: 'transparent',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0,
                      shadowRadius: 0,
                      elevation: 0,
                    }}
                  />
                )}
                
                <Animated.View
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: 22.5,
                    backgroundColor: focused ? '#40E0D0' : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 0,
                    transform: [
                      {
                        translateY: animatedValues.index.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -12],
                        }),
                      },
                      {
                        scale: animatedValues.index.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.12],
                        }),
                      },
                    ],
                    shadowColor: focused ? '#40E0D0' : 'transparent',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: focused ? 0.4 : 0,
                    shadowRadius: 12,
                    elevation: focused ? 15 : 0,
                    zIndex: focused ? 10 : 1,
                  }}
                >
                  <MaterialIcons 
                    name="home" 
                    size={focused ? 26 : 22} 
                    color={focused ? '#fff' : color} 
                  />
                </Animated.View>
              </View>
            );
          },
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: '',
          tabBarIcon: ({ focused, color, size }) => {
            useEffect(() => {
              animateTab('favorites', focused);
            }, [focused]);

            return (
              <View style={{ position: 'relative' }}>
                {/* تجويف شفاف للتبويب المحدد */}
                {focused && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: -8,
                      right: -8,
                      bottom: -12,
                      backgroundColor: 'transparent',
                      borderRadius: 30,
                      borderWidth: 0,
                      shadowColor: 'transparent',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0,
                      shadowRadius: 0,
                      elevation: 0,
                    }}
                  />
                )}
                
                <Animated.View
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: 22.5,
                    backgroundColor: focused ? '#40E0D0' : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 0,
                    transform: [
                      {
                        translateY: animatedValues.favorites.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -12],
                        }),
                      },
                      {
                        scale: animatedValues.favorites.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.12],
                        }),
                      },
                    ],
                    shadowColor: focused ? '#40E0D0' : 'transparent',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: focused ? 0.4 : 0,
                    shadowRadius: 12,
                    elevation: focused ? 15 : 0,
                    zIndex: focused ? 10 : 1,
                  }}
                >
                  <MaterialIcons 
                    name="favorite" 
                    size={focused ? 24 : 20} 
                    color={focused ? '#fff' : color} 
                  />
                </Animated.View>
              </View>
            );
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          tabBarIcon: ({ focused, color, size }) => {
            useEffect(() => {
              animateTab('profile', focused);
            }, [focused]);

            return (
              <View style={{ position: 'relative' }}>
                {/* تجويف شفاف للتبويب المحدد */}
                {focused && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: -8,
                      right: -8,
                      bottom: -12,
                      backgroundColor: 'transparent',
                      borderRadius: 30,
                      borderWidth: 0,
                      shadowColor: 'transparent',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0,
                      shadowRadius: 0,
                      elevation: 0,
                    }}
                  />
                )}
                
                <Animated.View
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: 22.5,
                    backgroundColor: focused ? '#40E0D0' : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 0,
                    transform: [
                      {
                        translateY: animatedValues.profile.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -12],
                        }),
                      },
                      {
                        scale: animatedValues.profile.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.12],
                        }),
                      },
                    ],
                    shadowColor: focused ? '#40E0D0' : 'transparent',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: focused ? 0.4 : 0,
                    shadowRadius: 12,
                    elevation: focused ? 15 : 0,
                    zIndex: focused ? 10 : 1,
                  }}
                >
                  <MaterialIcons 
                    name="person" 
                    size={focused ? 24 : 20} 
                    color={focused ? '#fff' : color} 
                  />
                </Animated.View>
              </View>
            );
          },
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