import { supabase, getUserAccountInfo } from './supabase';
import { sessionManager, UserSession } from './session-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Login user and create session
 */
export async function loginUser(phoneNumber: string): Promise<{
  success: boolean;
  session?: UserSession;
  error?: string;
  needsApproval?: boolean;
}> {
  try {
    console.log('🔐 Attempting login for:', phoneNumber);
    
    // Get user account info
    const userInfo = await getUserAccountInfo(phoneNumber);
    
    if (!userInfo.has_account) {
      return {
        success: false,
        error: 'لا يوجد حساب مرتبط بهذا الرقم'
      };
    }

    if (!userInfo.is_approved) {
      return {
        success: false,
        needsApproval: true,
        error: 'حسابك قيد المراجعة. سيتم إشعارك عند الموافقة عليه.'
      };
    }

    // Create session using session manager
    const session = await sessionManager.createSession({
      user_id: userInfo.user_id!,
      phone_number: phoneNumber,
      full_name: userInfo.full_name!,
      user_type: userInfo.user_type as 'merchant' | 'store_owner' | 'admin',
      is_approved: userInfo.is_approved
    });

    // Store phone number for future reference
    await AsyncStorage.setItem('user_phone', phoneNumber);

    console.log('✅ Login successful for:', userInfo.user_type);
    
    return {
      success: true,
      session
    };
  } catch (error) {
    console.error('💥 Login error:', error);
    return {
      success: false,
      error: 'حدث خطأ أثناء تسجيل الدخول'
    };
  }
}

/**
 * Check if user is currently logged in
 */
export async function checkLoginStatus(): Promise<{
  isLoggedIn: boolean;
  session?: UserSession;
  redirectTo?: string;
}> {
  try {
    const session = await sessionManager.getSession();
    
    if (!session) {
      return { isLoggedIn: false };
    }

    if (!session.is_approved) {
      // Clear session for unapproved users
      await sessionManager.clearSession();
      return { 
        isLoggedIn: false,
        redirectTo: '/auth/pending-approval'
      };
    }

    // Determine redirect path based on user type
    let redirectTo = '/onboarding/welcome';
    if (session.user_type === 'store_owner') {
      redirectTo = '/store-owner';
    } else if (session.user_type === 'merchant') {
      redirectTo = '/(tabs)';
    } else if (session.user_type === 'admin') {
      redirectTo = '/(tabs)'; // Update when admin dashboard is ready
    }

    return {
      isLoggedIn: true,
      session,
      redirectTo
    };
  } catch (error) {
    console.error('💥 Error checking login status:', error);
    return { isLoggedIn: false };
  }
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<boolean> {
  try {
    console.log('🚪 Logging out user...');
    
    // Clear session using session manager
    await sessionManager.clearSession();
    
    // Also sign out from Supabase auth
    await supabase.auth.signOut();
    
    // Clear stored phone number
    await AsyncStorage.removeItem('user_phone');
    
    console.log('✅ Logout successful');
    return true;
  } catch (error) {
    console.error('💥 Logout error:', error);
    return false;
  }
}

/**
 * Update user session info
 */
export async function updateSessionInfo(updates: Partial<UserSession>): Promise<boolean> {
  try {
    await sessionManager.updateUserInfo(updates);
    return true;
  } catch (error) {
    console.error('💥 Error updating session info:', error);
    return false;
  }
}

/**
 * Get current user from session
 */
export function getCurrentUser(): UserSession | null {
  return sessionManager.getCurrentUser();
}

/**
 * Refresh session (extend expiry)
 */
export async function refreshUserSession(): Promise<boolean> {
  try {
    return await sessionManager.refreshSession();
  } catch (error) {
    console.error('💥 Error refreshing session:', error);
    return false;
  }
} 