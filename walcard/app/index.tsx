import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { sessionManager } from '@/lib/session-manager';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('🔍 Checking authentication state...');
      
      // Check for existing session using our session manager
      const session = await sessionManager.getSession();
      
      if (session) {
        console.log('✅ Found valid session for user:', session.user_id);
        console.log('👤 User type:', session.user_type);
        console.log('✔️ Is approved:', session.is_approved);
        
        if (session.is_approved) {
          setIsAuthenticated(true);
          setUserType(session.user_type);
          
          // Refresh session to extend expiry
          await sessionManager.refreshSession();
          
          console.log('🔄 Redirecting to:', session.user_type === 'store_owner' ? 'store-owner' : 'merchant dashboard');
        } else {
          console.log('⚠️ User account not approved yet');
          // Clear session for unapproved users
          await sessionManager.clearSession();
        }
      } else {
        console.log('❌ No valid session found');
        
        // Clean up any expired sessions
        await sessionManager.cleanupExpiredSessions();
      }
    } catch (error) {
      console.error('💥 Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#fff' 
      }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  // If user is authenticated and approved, redirect to their dashboard
  if (isAuthenticated) {
    if (userType === 'store_owner') {
      return <Redirect href="/store-owner" />;
    } else if (userType === 'merchant') {
      return <Redirect href="/(tabs)" />;
    } else if (userType === 'admin') {
      // Add admin dashboard redirect here when ready
      return <Redirect href="/(tabs)" />;
    }
  }

  // If not authenticated, go to welcome screen
  return <Redirect href="/onboarding/welcome" />;
} 