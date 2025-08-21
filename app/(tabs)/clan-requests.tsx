import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { UserPlus, Send, Clock, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedListItem from '@/components/AnimatedListItem';
import UpdateToast from '@/components/UpdateToast';

export default function ClanRequestsScreen() {
  const { session, profile } = useAuth();
  const { clanRequests, requestsLoading, refreshClanRequests } = useData();
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [lastRequestsCount, setLastRequestsCount] = useState(0);
  const [freeFireUsername, setFreeFireUsername] = useState('');
  const [age, setAge] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLastRequestsCount(clanRequests.length);
  }, []);

  // Show toast when requests are updated
  useEffect(() => {
    if (lastRequestsCount > 0 && clanRequests.length !== lastRequestsCount) {
      setShowUpdateToast(true);
    }
    setLastRequestsCount(clanRequests.length);
  }, [clanRequests.length, lastRequestsCount]);

  const handleSubmitRequest = async () => {
    if (!freeFireUsername.trim() || !age.trim() || !reason.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 50) {
      Alert.alert('خطأ', 'يرجى إدخال عمر صحيح (10-50 سنة)');
      return;
    }

    // Check if user already has a pending request
    const hasPendingRequest = clanRequests.some(req => req.status === 'pending' && req.user_id === session?.user?.id);
    if (hasPendingRequest) {
      Alert.alert('تنبيه', 'لديك طلب قيد المراجعة بالفعل. يرجى انتظار الرد على طلبك الحالي.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('clan_join_requests')
        .insert({
          user_id: session?.user?.id,
          free_fire_username: freeFireUsername.trim(),
          age: ageNum,
          reason: reason.trim(),
        });

      if (error) throw error;

      Alert.alert('تم الإرسال!', 'تم إرسال طلب الانضمام بنجاح. سيتم مراجعته من قبل الإدارة.');
      
      // Clear form
      setFreeFireUsername('');
      setAge('');
      setReason('');
      
      // Refresh requests
      refreshClanRequests();
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFD700';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#FF4444';
      default: return '#CCCCCC';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'approved': return 'تم القبول';
      case 'rejected': return 'تم الرفض';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={20} color="#FFD700" />;
      case 'approved': return <CheckCircle size={20} color="#4CAF50" />;
      case 'rejected': return <XCircle size={20} color="#FF4444" />;
      default: return null;
    }
  };

  const renderRequestItem = ({ item }: { item: ClanJoinRequest }) => (
    <AnimatedListItem>
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.statusContainer}>
            {getStatusIcon(item.status)}
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
          <Text style={styles.requestDate}>
            {new Date(item.created_at).toLocaleDateString('ar-SA')}
          </Text>
        </View>
        
        <View style={styles.requestDetails}>
          <Text style={styles.requestLabel}>اسم المستخدم في فري فاير:</Text>
          <Text style={styles.requestValue}>{item.free_fire_username}</Text>
          
          <Text style={styles.requestLabel}>العمر:</Text>
          <Text style={styles.requestValue}>{item.age} سنة</Text>
          
          <Text style={styles.requestLabel}>سبب الانضمام:</Text>
          <Text style={styles.requestValue}>{item.reason}</Text>
        </View>
      </View>
    </AnimatedListItem>
  );

  return (
    <SafeAreaView style={styles.container}>
      <UpdateToast
        message="تم تحديث حالة طلب الانضمام!"
        type="info"
        visible={showUpdateToast}
        onHide={() => setShowUpdateToast(false)}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>طلب الإنضمام للكلان</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={requestsLoading} 
            onRefresh={refreshClanRequests} 
            tintColor="#DC143C" 
          />
        }
      >
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <UserPlus size={24} color="#DC143C" />
            <Text style={styles.sectionTitle}>طلب انضمام جديد</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>اسم المستخدم في فري فاير *</Text>
            <TextInput
              style={styles.input}
              value={freeFireUsername}
              onChangeText={setFreeFireUsername}
              placeholder="أدخل اسم المستخدم في فري فاير"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>العمر *</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="أدخل عمرك"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>سبب الانضمام / تعريف بنفسك *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="اكتب سبب رغبتك في الانضمام للكلان وعرّف بنفسك..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmitRequest}
            disabled={loading}
          >
            <Send size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>طلباتي السابقة</Text>
          
          {clanRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>لا توجد طلبات سابقة</Text>
            </View>
          ) : (
            <FlatList
              data={clanRequests}
              renderItem={renderRequestItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
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
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#DC143C',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'flex-end',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
    writingDirection: 'rtl',
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
  submitButton: {
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
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  historySection: {
    marginBottom: 20,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
    writingDirection: 'rtl',
  },
  requestDate: {
    fontSize: 12,
    color: '#888',
    writingDirection: 'rtl',
  },
  requestDetails: {
    gap: 8,
  },
  requestLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  requestValue: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    writingDirection: 'rtl',
  },
});