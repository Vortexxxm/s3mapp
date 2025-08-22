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
} from 'react-native';
import { Send, Bell, Users, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function NotificationSender() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'info' | 'news' | 'award' | 'leaderboard'>('info');
  const [sendingToAll, setSendingToAll] = useState(false);

  const notificationTypes = [
    { id: 'info' as const, label: 'معلومات عامة', color: '#2196F3' },
    { id: 'news' as const, label: 'أخبار', color: '#4CAF50' },
    { id: 'award' as const, label: 'جوائز', color: '#FFD700' },
    { id: 'leaderboard' as const, label: 'متصدرين', color: '#FF9800' },
  ];

  const sendNotificationToAll = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }

    setSendingToAll(true);
    try {
      // Get all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id');

      if (profilesError) throw profilesError;

      // Create notifications for all users
      const notifications = profiles?.map(profile => ({
        user_id: profile.id,
        title: title.trim(),
        message: message.trim(),
        type: notificationType,
      })) || [];

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      setTitle('');
      setMessage('');
      Alert.alert('نجح', `تم إرسال الإشعار لجميع المستخدمين (${notifications.length} مستخدم)`);
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setSendingToAll(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Bell size={20} color="#DC143C" />
        <Text style={styles.headerTitle}>إرسال إشعارات</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إرسال إشعار لجميع المستخدمين</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>عنوان الإشعار *</Text>
            <TextInput
              style={styles.input}
              placeholder="أدخل عنوان الإشعار"
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>محتوى الإشعار *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="أدخل محتوى الإشعار"
              placeholderTextColor="#666"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>نوع الإشعار</Text>
            <View style={styles.typeSelector}>
              {notificationTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    notificationType === type.id && styles.activeTypeButton,
                    { borderColor: type.color }
                  ]}
                  onPress={() => setNotificationType(type.id)}
                >
                  <Text style={[
                    styles.typeButtonText,
                    notificationType === type.id && { color: type.color }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.sendButton, sendingToAll && styles.buttonDisabled]}
            onPress={sendNotificationToAll}
            disabled={sendingToAll}
          >
            <Users size={20} color="#FFFFFF" />
            <Text style={styles.sendButtonText}>
              {sendingToAll ? 'جاري الإرسال...' : 'إرسال لجميع المستخدمين'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>معلومات مهمة</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoText}>• سيتم إرسال الإشعار لجميع المستخدمين المسجلين</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoText}>• سيصل الإشعار فوراً بفضل التحديث المباشر</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoText}>• يمكن للمستخدمين رؤية الإشعارات في قسم "الإشعارات"</Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 8,
    fontWeight: '500',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#1a1a1a',
  },
  activeTypeButton: {
    backgroundColor: '#333',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  sendButton: {
    backgroundColor: '#DC143C',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
  infoSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 12,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  infoItem: {
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#CCCCCC',
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 20,
  },
});