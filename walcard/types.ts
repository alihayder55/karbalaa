// Type definitions for the new database schema

export interface User {
  id: string;
  full_name: string;
  phone_number: string;
  phone_number_1?: string;
  phone_number_2?: string;
  whatsapp_number?: string;
  user_type: 'merchant' | 'store_owner' | 'admin';
  avatar_url?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Merchant {
  user_id: string;
  business_name: string;
  business_type: string;
  nearest_landmark: string;
  city: string;
  region: string;
  work_days: string;
  open_time: string;
  close_time: string;
  identity_image?: string;
  store_image?: string;
  latitude?: number;
  longitude?: number;
  abs: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreOwner {
  user_id: string;
  store_name: string;
  store_type: string;
  address: string;
  nearest_landmark: string;
  work_days: string;
  open_time: string;
  close_time: string;
  storefront_image?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
}

export interface Unit {
  id: string;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  merchant_id: string;
  category_id?: string;
  unit_id?: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id?: string;
  store_owner_id?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_order: number;
}

export interface OrderStatusLog {
  id: string;
  order_id: string;
  previous_status?: string;
  new_status: string;
  changed_by?: string;
  changed_at: string;
}

export interface UserAuthLog {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
  is_used: boolean;
}

export interface Report {
  id: string;
  reporter_id?: string;
  reported_user_id?: string;
  report_type?: string;
  description?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Admin {
  user_id: string;
  admin_level: number;
  created_at: string;
  updated_at: string;
}

export interface News {
  id: string;
  news_lable: string;
  description?: string;
  image_url?: string;
}

// Form data types
export interface UserRegistrationData {
  full_name: string;
  phone_number: string;
  phone_number_1?: string;
  phone_number_2?: string;
  whatsapp_number?: string;
  user_type: 'merchant' | 'store_owner';
}

export interface MerchantRegistrationData {
  user_id: string;
  business_name: string;
  business_type: string;
  nearest_landmark: string;
  city: string;
  region: string;
  work_days: string;
  open_time: string;
  close_time: string;
  identity_image?: string;
  store_image?: string;
  latitude?: number;
  longitude?: number;
  abs: boolean;
}

export interface StoreOwnerRegistrationData {
  user_id: string;
  store_name: string;
  store_type: string;
  address: string;
  nearest_landmark: string;
  work_days: string;
  open_time: string;
  close_time: string;
  storefront_image?: string;
  latitude?: number;
  longitude?: number;
}

// Static data types
export interface BusinessType {
  id: number;
  name: string;
  name_ar: string;
}

export interface WorkingDay {
  id: number;
  day_code: string;
  name_en: string;
  name_ar: string;
}

export interface City {
  id: number;
  name: string;
  name_ar: string;
}

// API response types
export interface UserAccountInfo {
  has_account: boolean;
  user_type?: string;
  is_approved?: boolean;
  full_name?: string;
  user_id?: string;
  has_merchant_account?: boolean;
  has_store_owner_account?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  error?: any;
  data?: T;
}

// Location types
export interface Location {
  latitude: number;
  longitude: number;
}

// Form validation types
export interface FormErrors {
  [key: string]: string;
}

// Navigation types
export interface AuthStackParamList {
  'unified-auth': undefined;
  'login': undefined;
  'register': undefined;
  'merchant-registration': { userId: string; fullName: string };
  'store-owner-registration': { userId: string; fullName: string };
  'verify': { phoneNumber: string; isRegistration: boolean; fullName?: string };
  'pending-approval': undefined;
  'user-type-selection': { userId: string; fullName: string };
} 