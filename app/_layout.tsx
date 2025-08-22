import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthScreen from '@/components/AuthScreen';
import ProfileSetupScreen from '@/components/ProfileSetupScreen';
import SplashScreen from '@/components/SplashScreen';

// Set RTL layout globally at app startup
I18nManager.forceRTL(true);

function AppContent() {
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

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
        <StatusBar style="auto" />
      </DataProvider>
    </AuthProvider>
  );
}