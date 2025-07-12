import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="product-details" />
      <Stack.Screen name="news-details" />
      <Stack.Screen name="offer-details" />
      <Stack.Screen name="order-details" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="help" />
      <Stack.Screen name="about" />
    </Stack>
  );
} 