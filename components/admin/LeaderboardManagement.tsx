import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Plus, Edit3, Trash2, Save, X, Trophy } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { supabase, LeaderboardEntry } from '@/lib/supabase';

export default function LeaderboardManagement() {
  const { leaderboard, refreshLeaderboard } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LeaderboardEntry | null>(null);
  const [teamName, setTeamName] = useState('');
  const [rank, setRank] = useState('');
  const [points, setPoints] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTeamName('');
    setRank('');
    setPoints('');
    setEditingEntry(null);
  };

  const handleSave = async () => {
    if (!teamName.trim() || !rank.trim() || !points.trim()) {
      Alert.alert('خطأ', 'جميع الحقول مطلوبة');
      return;
    }

    const rankNum = parseInt(rank);
    const pointsNum = parseInt(points);

    if (isNaN(rankNum) || isNaN(pointsNum) || rankNum < 1 || pointsNum < 0) {
      Alert.alert('خطأ', 'يرجى إدخال أرقام صحيحة');
      return;
    }

    setLoading(true);
    try {
      const entryData = {
        team_name: teamName.trim(),
        rank: rankNum,
        points: pointsNum,
      };

      if (editingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('leaderboard')
          .update(entryData)
          .eq('id', editingEntry.id);

        if (error) throw error;
        Alert.alert('نجح', 'تم تحديث الفريق بنجاح');
      } else {
        // Create new entry
        const { error } = await supabase
          .from('leaderboard')
          .insert([entryData]);

        if (error) throw error;
        Alert.alert('نجح', 'تم إضافة الفريق بنجاح');
      }

      resetForm();
      setShowAddModal(false);
      refreshLeaderboard();
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: LeaderboardEntry) => {
    setEditingEntry(item);
    setTeamName(item.team_name);
    setRank(item.rank.toString());
    setPoints(item.points.toString());
    setShowAddModal(true);
  };

  const handleDelete = (item: LeaderboardEntry) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الفريق؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('leaderboard')
                .delete()
                .eq('id', item.id);

              if (error) throw error;
              Alert.alert('نجح', 'تم حذف الفريق بنجاح');
              refreshLeaderboard();
            } catch (error: any) {
              Alert.alert('خطأ', error.message);
            }
          },
        },
      ]
    );
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
    const getRankColor = (rank: number) => {
      switch (rank) {
        case 1: return '#FFD700';
        case 2: return '#C0C0C0';
        case 3: return '#CD7F32';
        default: return '#FFFFFF';
      }
    };

    return (
      <View style={styles.entryCard}>
        <View style={styles.entryInfo}>
          <View style={styles.rankContainer}>
            <Text style={[styles.rank, { color: getRankColor(item.rank) }]}>
              #{item.rank}
            </Text>
            {item.rank <= 3 && (
              <Trophy size={20} color={getRankColor(item.rank)} />
            )}
          </View>
          
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{item.team_name}</Text>
            <Text style={styles.teamPoints}>{item.points} نقطة</Text>
          </View>
        </View>
        
        <View style={styles.entryActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(item)}
          >
            <Edit3 size={16} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>إضافة فريق جديد</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Add/Edit Entry Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingEntry ? 'تعديل الفريق' : 'إضافة فريق جديد'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>اسم الفريق *</Text>
              <TextInput
                style={styles.input}
                value={teamName}
                onChangeText={setTeamName}
                placeholder="أدخل اسم الفريق"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>الترتيب *</Text>
              <TextInput
                style={styles.input}
                value={rank}
                onChangeText={setRank}
                placeholder="أدخل ترتيب الفريق"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>النقاط *</Text>
              <TextInput
                style={styles.input}
                value={points}
                onChangeText={setPoints}
                placeholder="أدخل نقاط الفريق"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {loading ? 'جاري الحفظ...' : editingEntry ? 'تحديث الفريق' : 'إضافة الفريق'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  addButton: {
    backgroundColor: '#DC143C',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  listContainer: {
    padding: 20,
  },
  entryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  entryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  teamPoints: {
    fontSize: 14,
    color: '#CCCCCC',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  entryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#FF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  saveButton: {
    backgroundColor: '#DC143C',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
});