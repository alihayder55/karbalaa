import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const SESSION_KEY = 'walcard_user_session';
const AUTH_LOG_KEY = 'walcard_auth_log_id';

export interface UserSession {
  user_id: string;
  phone_number: string;
  full_name: string;
  user_type: 'merchant' | 'store_owner' | 'admin';
  is_approved: boolean;
  auth_log_id: string;
}

class SessionManager {
  private currentSession: UserSession | null = null;

  /**
   * Create a new session and store it in database
   */
  async createSession(user: {
    user_id: string;
    phone_number: string;
    full_name: string;
    user_type: 'merchant' | 'store_owner' | 'admin';
    is_approved: boolean;
  }): Promise<UserSession> {
    try {
      // Create auth log entry in database (expires in 365 days - almost permanent)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

      const { data: authLog, error } = await supabase
        .from('user_auth_logs')
        .insert({
          user_id: user.user_id,
          expires_at: expiresAt.toISOString(),
          is_used: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating auth log:', error);
        throw error;
      }

      const session: UserSession = {
        ...user,
        auth_log_id: authLog.id
      };

      // Store session locally
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      await AsyncStorage.setItem(AUTH_LOG_KEY, authLog.id);
      
      this.currentSession = session;
      
      console.log('✅ Session created successfully:', session.user_id);
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get current session from local storage and validate with database
   */
  async getSession(): Promise<UserSession | null> {
    try {
      // First check if we have a cached session
      if (this.currentSession) {
        return this.currentSession;
      }

      // Get session from local storage
      const sessionData = await AsyncStorage.getItem(SESSION_KEY);
      const authLogId = await AsyncStorage.getItem(AUTH_LOG_KEY);

      if (!sessionData || !authLogId) {
        console.log('❌ No local session found');
        return null;
      }

      const session: UserSession = JSON.parse(sessionData);

      // Validate session with database
      const { data: authLog, error } = await supabase
        .from('user_auth_logs')
        .select('*')
        .eq('id', authLogId)
        .eq('user_id', session.user_id)
        .eq('is_used', false)
        .single();

      if (error || !authLog) {
        console.log('❌ Auth log not found or invalid');
        await this.clearSession();
        return null;
      }

      // Check if session is expired
      const now = new Date();
      const expiresAt = new Date(authLog.expires_at);
      
      if (now > expiresAt) {
        console.log('❌ Session expired');
        await this.markSessionAsUsed(authLogId);
        await this.clearSession();
        return null;
      }

      // Get fresh user data from database to ensure it's up to date
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user_id)
        .single();

      if (userError || !userData) {
        console.log('❌ User data not found');
        await this.clearSession();
        return null;
      }

      // Update session with fresh data
      const freshSession: UserSession = {
        user_id: userData.id,
        phone_number: userData.phone_number,
        full_name: userData.full_name,
        user_type: userData.user_type,
        is_approved: userData.is_approved,
        auth_log_id: authLogId
      };

      // Update local storage with fresh data
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(freshSession));
      
      this.currentSession = freshSession;
      console.log('✅ Valid session found:', freshSession.user_id);
      
      return freshSession;
    } catch (error) {
      console.error('Error getting session:', error);
      await this.clearSession();
      return null;
    }
  }

  /**
   * Refresh session by extending expiry time
   */
  async refreshSession(): Promise<boolean> {
    try {
      const authLogId = await AsyncStorage.getItem(AUTH_LOG_KEY);
      if (!authLogId) return false;

      // Extend expiry by 1 year (365 days)
      const newExpiresAt = new Date();
      newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);

      const { error } = await supabase
        .from('user_auth_logs')
        .update({
          expires_at: newExpiresAt.toISOString()
        })
        .eq('id', authLogId);

      if (error) {
        console.error('Error refreshing session:', error);
        return false;
      }

      console.log('✅ Session refreshed successfully');
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }

  /**
   * Mark session as used (logout)
   */
  async markSessionAsUsed(authLogId: string): Promise<void> {
    try {
      await supabase
        .from('user_auth_logs')
        .update({ is_used: true })
        .eq('id', authLogId);
    } catch (error) {
      console.error('Error marking session as used:', error);
    }
  }

  /**
   * Clear session (logout)
   */
  async clearSession(): Promise<void> {
    try {
      const authLogId = await AsyncStorage.getItem(AUTH_LOG_KEY);
      
      // Mark session as used in database
      if (authLogId) {
        await this.markSessionAsUsed(authLogId);
      }

      // Clear local storage
      await AsyncStorage.removeItem(SESSION_KEY);
      await AsyncStorage.removeItem(AUTH_LOG_KEY);
      
      // Clear cache
      this.currentSession = null;
      
      console.log('✅ Session cleared successfully');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null && session.is_approved;
  }

  /**
   * Get current user info
   */
  getCurrentUser(): UserSession | null {
    return this.currentSession;
  }

  /**
   * Update user info in current session
   */
  async updateUserInfo(updates: Partial<UserSession>): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession = {
      ...this.currentSession,
      ...updates
    };

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(this.currentSession));
  }

  /**
   * Clean up expired sessions (can be called periodically)
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      await supabase
        .from('user_auth_logs')
        .update({ is_used: true })
        .lt('expires_at', now)
        .eq('is_used', false);
        
      console.log('✅ Expired sessions cleaned up');
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }
}

export const sessionManager = new SessionManager(); 