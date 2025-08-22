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
import { Plus, Edit3, Trash2, Save, X, Medal } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { supabase, TopPlayer } from '@/lib/supabase';

export default function TopPlayersManagement() {
  const { topPlayers, refreshTopPlayers } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<TopPlayer | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [position, setPosition] = useState('');
  const [mvpPoints, setMvpPoints] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setPlayerName('');
    setTeamName('');
    setPosition('');
    setMvpPoints('');
    setEditingPlayer(null);
  };

  const handleSave = async () => {
    if (!playerName.trim() || !teamName.trim() || !position.trim() || !mvpPoints.trim()) {
      Alert.alert('خطأ', 'جميع الحقول مطلوبة');
      return;
    }

    const pointsNum = parseInt(mvpPoints);
    if (isNaN(pointsNum) || pointsNum < 0) {
      Alert.alert('خطأ', 'يرجى إدخال نقاط MVP صحيحة');
      return;
    }

    setLoading(true);
    try {
      const playerData = {
        player_name: playerName.trim(),
        team_name: teamName.trim(),
        position: position.trim(),
        mvp_points: pointsNum,
      };

      if (editingPlayer) {
        // Update existing player
        const { error } = await supabase
          .from('top_players')
          .update(playerData)
          .eq('id', editingPlayer.id);

        if (error) throw error;
        Alert.alert('نجح', 'تم تحديث اللاعب بنجاح');
      } else {
        // Create new player
        const { error } = await supabase
          .from('top_players')
          .insert([playerData]);

        if (error) throw error;
        Alert.alert('نجح', 'تم إضافة اللاعب بنجاح');
      }

      resetForm();
      setShowAddModal(false);
      refreshTopPlayers();
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: TopPlayer) => {
    setEditingPlayer(item);
    setPlayerName(item.player_name);
    setTeamName(item.team_name);
    setPosition(item.position);
    setMvpPoints(item.mvp_points.toString());
    setShowAddModal(true);
  };

  const handleDelete = (item: TopPlayer) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا اللاعب؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('top_players')
                .delete()
                .eq('id', item.id);

              if (error) throw error;
              Alert.alert('نجح', 'تم حذف اللاعب بنجاح');
              refreshTopPlayers();
            } catch (error: any) {
              Alert.alert('خطأ', error.message);
            }
          },
        },
      ]
    );
  };

  const renderPlayerItem = ({ item }: { item: TopPlayer }) => (
    <View style={styles.playerCard}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.player_name}</Text>
        <Text style={styles.playerTeam}>{item.team_name} • {item.position}</Text>
        <Text style={styles.playerPoints}>{item.mvp_points} MVP Points</Text>
      </View>
      
      <View style={styles.playerActions}>
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
          <Text style={styles.addButtonText}>إضافة لاعب جديد</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={topPlayers}
        renderItem={renderPlayerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Add/Edit Player Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingPlayer ? 'تعديل اللاعب' : 'إضافة لاعب جديد'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>اسم اللاعب *</Text>
              <TextInput
                style={styles.input}
                value={playerName}
                onChangeText={setPlayerName}
                placeholder="أدخل اسم اللاعب"
                placeholderTextColor="#666"
              />
            </View>

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
              <Text style={styles.inputLabel}>المركز *</Text>
              <TextInput
                style={styles.input}
                value={position}
                onChangeText={setPosition}
                placeholder="مثال: قائد الفريق، مهاجم، مدافع"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>نقاط MVP *</Text>
              <TextInput
                style={styles.input}
                value={mvpPoints}
                onChangeText={setMvpPoints}
                placeholder="أدخل نقاط MVP"
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
                {loading ? 'جاري الحفظ...' : editingPlayer ? 'تحديث اللاعب' : 'إضافة اللاعب'}
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
  playerCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  playerTeam: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  playerPoints: {
    fontSize: 16,
    color: '#DC143C',
    fontWeight: '500',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  playerActions: {
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