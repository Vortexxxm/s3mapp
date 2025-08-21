import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Bell, CircleCheck as CheckCircle, Info, Trophy, Medal, Newspaper } from 'lucide-react-native';
import { Notification } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import AnimatedListItem from '@/components/AnimatedListItem';

export default function NotificationsScreen() {
  const { notifications, notificationsLoading, refreshNotifications, markNotificationAsRead } = useData();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'news': return <Newspaper size={20} color="#2196F3" />;
      case 'award': return <Medal size={20} color="#FFD700" />;
      case 'leaderboard': return <Trophy size={20} color="#4CAF50" />;
      default: return <Info size={20} color="#CCCCCC" />;
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
  };

  const renderNotificationItem = ({ item, index }: { item: Notification; index: number }) => (
    <AnimatedListItem delay={index * 50}>
      <TouchableOpacity 
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.iconContainer}>
              {getNotificationIcon(item.type)}
              {!item.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationTime}>
              {new Date(item.created_at).toLocaleDateString('ar-SA')}
            </Text>
          </View>
          
          <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
        </View>
      </TouchableOpacity>
    </AnimatedListItem>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Bell size={24} color="#DC143C" />
        <Text style={styles.headerTitle}>الإشعارات</Text>
      </View>
      
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={notificationsLoading}
            onRefresh={refreshNotifications}
            tintColor="#DC143C"
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={48} color="#666" />
            <Text style={styles.emptyText}>لا توجد إشعارات</Text>
          </View>
        }
      />
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#DC143C',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  notificationCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  unreadCard: {
    borderColor: '#DC143C',
    backgroundColor: '#1a1a1a',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC143C',
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
    writingDirection: 'rtl',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  unreadTitle: {
    color: '#DC143C',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    writingDirection: 'rtl',
  },
});