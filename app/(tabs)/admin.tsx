import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Settings, Newspaper, Trophy, Medal, Users, Crown, UserCheck } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import NewsManagement from '@/components/admin/NewsManagement';
import LeaderboardManagement from '@/components/admin/LeaderboardManagement';
import TopPlayersManagement from '@/components/admin/TopPlayersManagement';
import ClanRequestsManagement from '@/components/admin/ClanRequestsManagement';
import MembersManagement from '@/components/admin/MembersManagement';
import NotificationSender from '@/components/admin/NotificationSender';

type AdminSection = 'news' | 'leaderboard' | 'players' | 'requests' | 'members' | 'notifications';

export default function AdminScreen() {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('news');

  // Redirect if not admin
  if (profile?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>غير مصرح لك بالوصول لهذه الصفحة</Text>
        </View>
      </SafeAreaView>
    );
  }

  const adminSections = [
    { id: 'news' as AdminSection, title: 'إدارة الأخبار', icon: Newspaper },
    { id: 'leaderboard' as AdminSection, title: 'إدارة المتصدرين', icon: Trophy },
    { id: 'players' as AdminSection, title: 'إدارة أفضل لاعب', icon: Medal },
    { id: 'requests' as AdminSection, title: 'طلبات الانضمام', icon: Users },
    { id: 'members' as AdminSection, title: 'إدارة الأعضاء', icon: UserCheck },
    { id: 'notifications' as AdminSection, title: 'إرسال إشعارات', icon: Crown },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'news':
        return <NewsManagement />;
      case 'leaderboard':
        return <LeaderboardManagement />;
      case 'players':
        return <TopPlayersManagement />;
      case 'requests':
        return <ClanRequestsManagement />;
      case 'members':
        return <MembersManagement />;
      case 'notifications':
        return <NotificationSender />;
      default:
        return <NewsManagement />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Settings size={24} color="#DC143C" />
        <Text style={styles.headerTitle}>لوحة تحكم الأدمن</Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {adminSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <TouchableOpacity
                key={section.id}
                style={[
                  styles.tab,
                  activeSection === section.id && styles.activeTab
                ]}
                onPress={() => setActiveSection(section.id)}
              >
                <IconComponent 
                  size={18} 
                  color={activeSection === section.id ? '#FFFFFF' : '#CCCCCC'} 
                />
                <Text style={[
                  styles.tabText,
                  activeSection === section.id && styles.activeTabText
                ]}>
                  {section.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC143C',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    marginVertical: 8,
  },
  activeTab: {
    backgroundColor: '#DC143C',
  },
  tabText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 6,
    writingDirection: 'rtl',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#FF4444',
    writingDirection: 'rtl',
  },
});