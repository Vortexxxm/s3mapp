import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Settings, Plus, Send, Users, CheckCircle, XCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { supabase, ClanJoinRequest } from '@/lib/supabase';

export default function AdminScreen() {
  const { profile } = useAuth();
  const { clanRequests, refreshClanRequests, requestsLoading } = useData();
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);

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

  const sendNotificationToAll = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }

    setSendingNotification(true);
    try {
      // Get all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id');

      if (profilesError) throw profilesError;

      // Create notifications for all users
      const notifications = profiles?.map(profile => ({
        user_id: profile.id,
        title: notificationTitle.trim(),
        message: notificationMessage.trim(),
        type: 'info' as const,
      })) || [];

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      setNotificationTitle('');
      setNotificationMessage('');
      Alert.alert('نجح', 'تم إرسال الإشعار لجميع المستخدمين');
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setSendingNotification(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('clan_join_requests')
        .update({ status: action })
        .eq('id', requestId);

      if (error) throw error;

      Alert.alert('نجح', `تم ${action === 'approved' ? 'قبول' : 'رفض'} الطلب`);
      refreshClanRequests();
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    }
  };

  const renderRequestItem = ({ item }: { item: ClanJoinRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestUsername}>
          {item.profiles?.username || 'مستخدم غير معروف'}
        </Text>
        <Text style={[
          styles.requestStatus,
          item.status === 'approved' && styles.approvedStatus,
          item.status === 'rejected' && styles.rejectedStatus,
        ]}>
          {item.status === 'pending' ? 'في الانتظار' : 
           item.status === 'approved' ? 'مقبول' : 'مرفوض'}
        </Text>
      </View>
      
      <Text style={styles.requestDetail}>
        اسم اللاعب في فري فاير: {item.free_fire_username}
      </Text>
      <Text style={styles.requestDetail}>العمر: {item.age}</Text>
      <Text style={styles.requestReason}>{item.reason}</Text>
      
      {item.status === 'pending' && (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleRequestAction(item.id, 'approved')}
          >
            <CheckCircle size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>قبول</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRequestAction(item.id, 'rejected')}
          >
            <XCircle size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>رفض</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Settings size={24} color="#DC143C" />
        <Text style={styles.headerTitle}>لوحة الإدارة</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Send Notification Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إرسال إشعار لجميع المستخدمين</Text>
          
          <TextInput
            style={styles.input}
            placeholder="عنوان الإشعار"
            placeholderTextColor="#666"
            value={notificationTitle}
            onChangeText={setNotificationTitle}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="محتوى الإشعار"
            placeholderTextColor="#666"
            value={notificationMessage}
            onChangeText={setNotificationMessage}
            multiline
            numberOfLines={3}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, sendingNotification && styles.buttonDisabled]}
            onPress={sendNotificationToAll}
            disabled={sendingNotification}
          >
            <Send size={20} color="#FFFFFF" />
            <Text style={styles.sendButtonText}>
              {sendingNotification ? 'جاري الإرسال...' : 'إرسال الإشعار'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Clan Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#DC143C" />
            <Text style={styles.sectionTitle}>طلبات الانضمام للكلان</Text>
          </View>
          
          <FlatList
            data={clanRequests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={requestsLoading}
                onRefresh={refreshClanRequests}
                tintColor="#DC143C"
              />
            }
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Users size={48} color="#666" />
                <Text style={styles.emptyText}>لا توجد طلبات انضمام</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
    writingDirection: 'rtl',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#DC143C',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  requestCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestUsername: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  requestStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFD700',
    writingDirection: 'rtl',
  },
  approvedStatus: {
    color: '#4CAF50',
  },
  rejectedStatus: {
    color: '#FF4444',
  },
  requestDetail: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  requestReason: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
    writingDirection: 'rtl',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    writingDirection: 'rtl',
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