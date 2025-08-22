import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { CircleCheck as CheckCircle, Circle as XCircle, Eye, Users, Phone } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { supabase, ClanJoinRequest } from '@/lib/supabase';

export default function ClanRequestsManagement() {
  const { clanRequests, refreshClanRequests, requestsLoading } = useData();
  const [selectedRequest, setSelectedRequest] = useState<ClanJoinRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('clan_join_requests')
        .update({ status: action })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Get the request details to send notification
      const request = clanRequests.find(r => r.id === requestId);
      if (request) {
        // Send notification to user
        const notificationData = {
          user_id: request.user_id,
          title: action === 'approved' ? 'تم قبول طلبك!' : 'تم رفض طلبك',
          message: action === 'approved' 
            ? `مرحباً بك في كلان S3M! تم قبول طلب انضمامك. اسم المستخدم في فري فاير: ${request.free_fire_username}`
            : `نأسف، تم رفض طلب انضمامك للكلان. يمكنك المحاولة مرة أخرى لاحقاً.`,
          type: action === 'approved' ? 'award' : 'info',
        };

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([notificationData]);

        if (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }

      Alert.alert('نجح', `تم ${action === 'approved' ? 'قبول' : 'رفض'} الطلب وإرسال إشعار للمستخدم`);
      refreshClanRequests();
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    }
  };

  const handleViewDetails = (request: ClanJoinRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#FF4444';
      default: return '#FFD700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'مقبول';
      case 'rejected': return 'مرفوض';
      default: return 'في الانتظار';
    }
  };

  const renderRequestItem = ({ item }: { item: ClanJoinRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestUsername}>
          {item.profiles?.username || 'مستخدم غير معروف'}
        </Text>
        <Text style={[styles.requestStatus, { color: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
      </View>
      
      <Text style={styles.requestDetail}>
        اسم اللاعب في فري فاير: {item.free_fire_username}
      </Text>
      <Text style={styles.requestDetail}>العمر: {item.age}</Text>
      <Text style={styles.requestReason} numberOfLines={2}>
        {item.reason}
      </Text>
      <Text style={styles.requestDate}>
        تاريخ التقديم: {new Date(item.created_at).toLocaleDateString('ar-SA')}
      </Text>
      
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => handleViewDetails(item)}
        >
          <Eye size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>عرض التفاصيل</Text>
        </TouchableOpacity>
        
        {item.status === 'pending' && (
          <>
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
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Users size={20} color="#DC143C" />
        <Text style={styles.headerTitle}>طلبات الانضمام للكلان</Text>
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
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Users size={48} color="#666" />
            <Text style={styles.emptyText}>لا توجد طلبات انضمام</Text>
          </View>
        }
      />

      {/* Request Details Modal */}
      <Modal visible={showDetailModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>تفاصيل طلب الانضمام</Text>
            <View style={styles.placeholder} />
          </View>

          {selectedRequest && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>اسم المستخدم</Text>
                <Text style={styles.detailValue}>
                  {selectedRequest.profiles?.username || 'مستخدم غير معروف'}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>اسم اللاعب في فري فاير</Text>
                <Text style={styles.detailValue}>{selectedRequest.free_fire_username}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>العمر</Text>
                <Text style={styles.detailValue}>{selectedRequest.age} سنة</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>سبب الانضمام</Text>
                <Text style={styles.detailValue}>{selectedRequest.reason}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>حالة الطلب</Text>
                <Text style={[styles.detailValue, { color: getStatusColor(selectedRequest.status) }]}>
                  {getStatusText(selectedRequest.status)}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>تاريخ التقديم</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedRequest.created_at).toLocaleDateString('ar-SA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>

              {selectedRequest.status === 'pending' && (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => {
                      handleRequestAction(selectedRequest.id, 'approved');
                      setShowDetailModal(false);
                    }}
                  >
                    <CheckCircle size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>قبول الطلب</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => {
                      handleRequestAction(selectedRequest.id, 'rejected');
                      setShowDetailModal(false);
                    }}
                  >
                    <XCircle size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>رفض الطلب</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
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
    flexGrow: 1,
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
    writingDirection: 'rtl',
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
    marginBottom: 8,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  requestDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
  },
  viewButton: {
    backgroundColor: '#2196F3',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    writingDirection: 'rtl',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  placeholder: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  detailLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    fontWeight: '500',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  detailValue: {
    fontSize: 16,
    color: '#FFFFFF',
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 22,
  },
  modalActions: {
    marginTop: 20,
    gap: 12,
  },
});