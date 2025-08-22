import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { UserCheck, Shield, User, Crown } from 'lucide-react-native';
import { supabase, Profile } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function MembersManagement() {
  const { session } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin', username: string) => {
    const roleText = newRole === 'admin' ? 'مشرف' : 'مستخدم عادي';
    
    Alert.alert(
      'تأكيد تغيير الدور',
      `هل أنت متأكد من تغيير دور ${username} إلى ${roleText}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

              if (error) throw error;

              // Send notification to user about role change
              const notificationData = {
                user_id: userId,
                title: 'تم تغيير دورك!',
                message: `تم تغيير دورك إلى ${roleText}. ${newRole === 'admin' ? 'مبروك! أصبحت مشرفاً في S3M HUB.' : 'تم تغيير دورك إلى مستخدم عادي.'}`,
                type: 'info' as const,
              };

              await supabase
                .from('notifications')
                .insert([notificationData]);

              Alert.alert('نجح', `تم تغيير دور ${username} إلى ${roleText}`);
              fetchMembers();
            } catch (error: any) {
              Alert.alert('خطأ', error.message);
            }
          },
        },
      ]
    );
  };

  const renderMemberItem = ({ item }: { item: Profile }) => {
    const isCurrentUser = item.id === session?.user?.id;
    
    return (
      <View style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <View style={styles.avatarContainer}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
              <User size={40} color="#DC143C" />
            )}
          </View>
          
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>{item.username}</Text>
            <Text style={styles.memberRole}>
              {item.role === 'admin' ? 'مشرف' : 'مستخدم عادي'}
            </Text>
            <Text style={styles.memberDate}>
              عضو منذ: {new Date(item.created_at).toLocaleDateString('ar-SA')}
            </Text>
            {item.age && (
              <Text style={styles.memberAge}>العمر: {item.age}</Text>
            )}
          </View>
        </View>
        
        {!isCurrentUser && (
          <View style={styles.memberActions}>
            {item.role === 'user' ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.promoteButton]}
                onPress={() => handleRoleChange(item.id, 'admin', item.username)}
              >
                <Crown size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>ترقية لمشرف</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.demoteButton]}
                onPress={() => handleRoleChange(item.id, 'user', item.username)}
              >
                <User size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>تخفيض لمستخدم</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {isCurrentUser && (
          <View style={styles.currentUserBadge}>
            <Shield size={16} color="#DC143C" />
            <Text style={styles.currentUserText}>أنت</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <UserCheck size={20} color="#DC143C" />
        <Text style={styles.headerTitle}>إدارة الأعضاء</Text>
      </View>
      
      <FlatList
        data={members}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchMembers}
            tintColor="#DC143C"
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  listContainer: {
    padding: 20,
  },
  memberCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  memberRole: {
    fontSize: 14,
    color: '#DC143C',
    fontWeight: '500',
    marginBottom: 4,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  memberDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  memberAge: {
    fontSize: 12,
    color: '#888',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  promoteButton: {
    backgroundColor: '#4CAF50',
  },
  demoteButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
    writingDirection: 'rtl',
  },
  currentUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  currentUserText: {
    color: '#DC143C',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
    writingDirection: 'rtl',
  },
});