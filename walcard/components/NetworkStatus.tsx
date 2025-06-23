import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { checkNetworkConnectivity } from '../lib/test-connection';

interface NetworkStatusProps {
  showStatus?: boolean;
}

export default function NetworkStatus({ showStatus = false }: NetworkStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkNetworkConnectivity();
      setIsConnected(connected);
      setIsDevelopment(__DEV__);
    };

    checkConnection();

    // Check connection every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!showStatus || isConnected === null) {
    return null;
  }

  return (
    <View style={[styles.container, isConnected ? styles.connected : styles.disconnected]}>
      <Text style={styles.text}>
        {isConnected 
          ? (isDevelopment ? 'متصل (وضع التطوير)' : 'متصل بالإنترنت')
          : 'غير متصل بالإنترنت'
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#F44336',
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
}); 