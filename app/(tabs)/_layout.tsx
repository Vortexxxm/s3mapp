import { Tabs } from 'expo-router';
import { Chrome as Home, Trophy, Medal, User, Settings, UserPlus } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';

export default function TabLayout() {
  const { profile, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Force RTL layout
    I18nManager.forceRTL(true);
  }, []);

  useEffect(() => {
    // Only show admin tab if user is explicitly an admin
    setIsAdmin(profile?.role === 'admin');
  }, [profile]);

  // Don't render tabs until we know the user's role
  if (loading || !profile) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#333',
          borderTopWidth: 1,
          paddingBottom: 8,
          height: 88,
        },
        tabBarActiveTintColor: '#DC143C',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: 'System',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'المتصدّرون',
          tabBarIcon: ({ size, color }) => (
            <Trophy size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="top-players"
        options={{
          title: 'أفضل لاعب',
          tabBarIcon: ({ size, color }) => (
            <Medal size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clan-requests"
        options={{
          title: 'طلب الإنضمام',
          tabBarIcon: ({ size, color }) => (
            <UserPlus size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'الملف الشخصي',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'الإدارة',
            tabBarIcon: ({ size, color }) => (
              <Settings size={size} color={color} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}