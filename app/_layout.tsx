import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import SplashScreen from '@/components/SplashScreen';
import AuthScreen from '@/components/AuthScreen';

function AppContent() {
  const { session, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: '#1a1a1a' }} />;
  }

  if (!session) {
    return <AuthScreen />;
  }

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