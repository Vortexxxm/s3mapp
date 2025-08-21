import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';

interface RealtimeIndicatorProps {
  isConnected: boolean;
}

export default function RealtimeIndicator({ isConnected }: RealtimeIndicatorProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setShowIndicator(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowIndicator(false);
      });
    }
  }, [isConnected, fadeAnim]);

  if (!showIndicator) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.indicator}>
        <WifiOff size={16} color="#FF4444" />
        <Text style={styles.text}>انقطع الاتصال - جاري إعادة المحاولة...</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  indicator: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  text: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
});