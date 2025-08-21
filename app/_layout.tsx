import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import SplashScreen from '@/components/SplashScreen';
import AuthScreen from '@/components/AuthScreen';
import ProfileSetupScreen from '@/components/ProfileSetupScreen';

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#DC143C" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

function AppContent() {
  const { session, loading, profile } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading before hiding splash
    if (!loading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        setInitializing(false);
      }, 1000); // Give splash screen at least 1 second

      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Show loading while auth is initializing
  if (initializing || loading) {
    return <LoadingScreen />;
  }

  // No session - show auth screen
  if (!session) {
    return <AuthScreen />;
  }

  // Session exists but no profile or incomplete profile - show setup
  if (!profile || !profile.username || !profile.avatar_url) {
    return <ProfileSetupScreen />;
  }

  // Session exists and profile is complete - show main app
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
    <>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
});