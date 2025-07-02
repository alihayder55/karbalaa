import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const supabaseUrl = 'https://wbpynqwkamxxddoteswm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicHlucXdrYW14eGRkb3Rlc3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY2NzUyNiwiZXhwIjoyMDY1MjQzNTI2fQ.0XTDeQKW70f90Fzj2FZsiRPS-e4TcI253SA9wek4IkQ';

// Create a custom storage adapter that handles AsyncStorage safely
const createSafeStorage = () => {
  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        return await AsyncStorage.getItem(key);
      } catch (error) {
        console.warn('AsyncStorage getItem error:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.warn('AsyncStorage setItem error:', error);
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.warn('AsyncStorage removeItem error:', error);
      }
    },
  };
};

// Create Supabase client with safe storage configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: createSafeStorage(),
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Function to get user account info for new schema
export async function getUserAccountInfo(phoneNumber: string) {
  try {
    console.log('🔍 Checking user account for phone:', phoneNumber);
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        phone_number,
        user_type,
        is_approved
      `)
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user account info:', error);
      return {
        has_account: false,
        user_type: null,
        is_approved: false,
        full_name: null,
        user_id: null,
        has_merchant_account: false,
        has_store_owner_account: false
      };
    }

    if (!data) {
      console.log('❌ No user found for phone:', phoneNumber);
      return {
        has_account: false,
        user_type: null,
        is_approved: false,
        full_name: null,
        user_id: null,
        has_merchant_account: false,
        has_store_owner_account: false
      };
    }

    console.log('✅ User found:', data);

    const { data: merchantData } = await supabase
      .from('merchants')
      .select('user_id')
      .eq('user_id', data.id)
      .maybeSingle();

    const { data: storeOwnerData } = await supabase
      .from('store_owners')
      .select('user_id')
      .eq('user_id', data.id)
      .maybeSingle();

    const result = {
      has_account: true,
      user_type: data.user_type,
      is_approved: data.is_approved,
      full_name: data.full_name,
      user_id: data.id,
      has_merchant_account: !!merchantData,
      has_store_owner_account: !!storeOwnerData
    };

    console.log('📋 User account info result:', result);
    return result;
  } catch (error) {
    console.error('Error in getUserAccountInfo:', error);
    return {
      has_account: false,
      user_type: null,
      is_approved: false,
      full_name: null,
      user_id: null,
      has_merchant_account: false,
      has_store_owner_account: false
    };
  }
}

// Function to create a new user
export async function createUser(userData: {
  full_name: string;
  phone_number: string;
  user_type: 'merchant' | 'store_owner' | 'admin';
  avatar_url?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return { success: false, error, data: null };
    }

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Error in createUser:', error);
    return { success: false, error, data: null };
  }
}

// Function to create a merchant account
export async function createMerchant(merchantData: {
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
}) {
  try {
    const { data, error } = await supabase
      .from('merchants')
      .insert([merchantData])
      .select()
      .single();

    if (error) {
      console.error('Error creating merchant:', error);
      return { success: false, error, data: null };
    }

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Error in createMerchant:', error);
    return { success: false, error, data: null };
  }
}

// Function to create a store owner account
export async function createStoreOwner(storeOwnerData: {
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
}) {
  try {
    const { data, error } = await supabase
      .from('store_owners')
      .insert([storeOwnerData])
      .select()
      .single();

    if (error) {
      console.error('Error creating store owner:', error);
      return { success: false, error, data: null };
    }

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Error in createStoreOwner:', error);
    return { success: false, error, data: null };
  }
}

// Function to get business types (static list)
export async function getBusinessTypes() {
  return [
    { id: 1, name: 'food', name_ar: 'مواد غذائية' },
    { id: 2, name: 'meat', name_ar: 'لحوم' },
    { id: 3, name: 'dairy', name_ar: 'ألبان' },
    { id: 4, name: 'cleaning', name_ar: 'منظفات' },
    { id: 5, name: 'vegetables', name_ar: 'خضروات وفواكه' },
    { id: 6, name: 'bakery', name_ar: 'مخبز' },
    { id: 7, name: 'restaurant', name_ar: 'مطعم' },
    { id: 8, name: 'cafe', name_ar: 'كافيه' },
    { id: 9, name: 'supermarket', name_ar: 'سوبر ماركت' },
    { id: 10, name: 'hypermarket', name_ar: 'هايبر ماركت' },
    { id: 11, name: 'pharmacy', name_ar: 'صيدلية' },
    { id: 12, name: 'other', name_ar: 'أخرى' }
  ];
}

// Function to get working days (static list)
export async function getWorkingDays() {
  return [
    { id: 1, day_code: 'saturday', name_en: 'Saturday', name_ar: 'السبت' },
    { id: 2, day_code: 'sunday', name_en: 'Sunday', name_ar: 'الأحد' },
    { id: 3, day_code: 'monday', name_en: 'Monday', name_ar: 'الاثنين' },
    { id: 4, day_code: 'tuesday', name_en: 'Tuesday', name_ar: 'الثلاثاء' },
    { id: 5, day_code: 'wednesday', name_en: 'Wednesday', name_ar: 'الأربعاء' },
    { id: 6, day_code: 'thursday', name_en: 'Thursday', name_ar: 'الخميس' },
    { id: 7, day_code: 'friday', name_en: 'Friday', name_ar: 'الجمعة' }
  ];
}

// Function to get cities (static list)
export async function getCities() {
  return [
    { id: 1, name: 'baghdad', name_ar: 'بغداد' },
    { id: 2, name: 'basra', name_ar: 'البصرة' },
    { id: 3, name: 'mosul', name_ar: 'الموصل' },
    { id: 4, name: 'erbil', name_ar: 'أربيل' },
    { id: 5, name: 'sulaymaniyah', name_ar: 'السليمانية' },
    { id: 6, name: 'karbala', name_ar: 'كربلاء' },
    { id: 7, name: 'najaf', name_ar: 'النجف' },
    { id: 8, name: 'kirkuk', name_ar: 'كركوك' },
    { id: 9, name: 'diyala', name_ar: 'ديالى' },
    { id: 10, name: 'wasit', name_ar: 'واسط' },
    { id: 11, name: 'qadisiyah', name_ar: 'القادسية' },
    { id: 12, name: 'babil', name_ar: 'بابل' },
    { id: 13, name: 'anbar', name_ar: 'الأنبار' },
    { id: 14, name: 'nineveh', name_ar: 'نينوى' },
    { id: 15, name: 'dhi_qar', name_ar: 'ذي قار' },
    { id: 16, name: 'maysan', name_ar: 'ميسان' },
    { id: 17, name: 'dohuk', name_ar: 'دهوك' },
    { id: 18, name: 'halabja', name_ar: 'حلبجة' }
  ];
}

// Utility functions
export function getSupabaseUrl(path: string): string {
  return supabaseUrl + '/storage/v1/object/public/' + path;
}

export function getSupabaseUrl1(path: string): string {
  return path;
}



export { supabase }; 