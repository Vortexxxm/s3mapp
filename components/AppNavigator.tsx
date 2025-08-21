import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import AuthScreen from '@/components/AuthScreen';
import ProfileSetupScreen from '@/components/ProfileSetupScreen';
import SplashScreen from '@/components/SplashScreen';

export default function AppNavigator() {
  const { session, profile, loading, initializing } = useAuth();

  // Show splash screen while initializing
  if (initializing) {
    return <SplashScreen onFinish={() => {}} />;
  }

  // Show auth screen if no session
  if (!session) {
    return <AuthScreen />;
  }

  // Show profile setup if user has session but no profile
  if (session && !profile && !loading) {
    return <ProfileSetupScreen />;
  }

  // Show loading while profile is being fetched
  if (session && !profile && loading) {
    return <SplashScreen onFinish={() => {}} />;
  }

  // Show main app if user is authenticated and has profile
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});