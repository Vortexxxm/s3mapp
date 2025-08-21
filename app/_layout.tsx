import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';

// Set RTL layout globally at app startup
I18nManager.forceRTL(true);

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <DataProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </DataProvider>
    </AuthProvider>
  );
}