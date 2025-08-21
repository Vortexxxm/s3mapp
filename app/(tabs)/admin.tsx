import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { Plus, CreditCard as Edit, Trash2, X, Camera, Award, Crown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase, NewsItem, LeaderboardEntry, TopPlayer, Profile, SpecialAward } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type ManagementType = 'news' | 'leaderboard' | 'topPlayers' | 'awards' | 'users';

export default function AdminScreen() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<ManagementType>('news');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Data states
  const [news, setNews] = useState<NewsItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [specialAwards, setSpecialAwards] = useState<SpecialAward[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [teamName, setTeamName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [rank, setRank] = useState('');
  const [points, setPoints] = useState('');
  const [mvpPoints, setMvpPoints] = useState('');
  const [position, setPosition] = useState('');
  const [awardType, setAwardType] = useState<'player_of_week' | 'player_of_month' | 'leader_of_week'>('player_of_week');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [description, setDescription] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    
    fetchAllData();
  }, [profile]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchNews(),
      fetchLeaderboard(),
      fetchTopPlayers(),
      fetchSpecialAwards(),
      fetchUsers(),
    ]);
  };

  const fetchNews = async () => {
    const { data } = await supabase
      .from('news')
      .select('*, profiles:created_by (username)')
      .order('created_at', { ascending: false });
    setNews(data || []);
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('leaderboard')
      .select('*')
      .order('rank');
    setLeaderboard(data || []);
  };

  const fetchTopPlayers = async () => {
    const { data } = await supabase
      .from('top_players')
      .select('*')
      .order('mvp_points', { ascending: false });
    setTopPlayers(data || []);
  };

  const fetchSpecialAwards = async () => {
    const { data } = await supabase
      .from('special_awards')
      .select('*, profiles:user_id (username)')
      .order('created_at', { ascending: false });
    setSpecialAwards(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers(data || []);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setImageUrl('');
    setVideoUrl('');
    setTeamName('');
    setPlayerName('');
    setRank('');
    setPoints('');
    setMvpPoints('');
    setPosition('');
    setAwardType('player_of_week');
    setSelectedUserId('');
    setDescription('');
    setUsername('');
    setAge('');
    setBio('');
    setRole('user');
    setEditingItem(null);
  };

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      if (activeTab === 'news') {
        setTitle(item.title);
        setContent(item.content);
        setImageUrl(item.image_url || '');
        setVideoUrl(item.video_url || '');
      } else if (activeTab === 'leaderboard') {
        setTeamName(item.team_name);
        setRank(item.rank.toString());
        setPoints(item.points.toString());
      } else if (activeTab === 'topPlayers') {
        setPlayerName(item.player_name);
        setTeamName(item.team_name);
        setPosition(item.position);
        setMvpPoints(item.mvp_points.toString());
      } else if (activeTab === 'awards') {
        setAwardType(item.award_type);
        setTitle(item.title);
        setDescription(item.description);
        setSelectedUserId(item.user_id || '');
        setImageUrl(item.image_url || '');
      } else if (activeTab === 'users') {
        setUsername(item.username);
        setAge(item.age?.toString() || '');
        setBio(item.bio || '');
        setRole(item.role);
      }
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'news') {
        await saveNews();
      } else if (activeTab === 'leaderboard') {
        await saveLeaderboard();
      } else if (activeTab === 'topPlayers') {
        await saveTopPlayer();
      } else if (activeTab === 'awards') {
        await saveSpecialAward();
      } else if (activeTab === 'users') {
        await saveUser();
      }
      closeModal();
      fetchAllData();
      Alert.alert('Success', 'Changes saved successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const saveNews = async () => {
    if (!title || !content) throw new Error('Title and content are required');
    
    const newsData = { 
      title, 
      content, 
      image_url: imageUrl || null,
      video_url: videoUrl || null,
      created_by: profile?.id 
    };
    
    if (editingItem) {
      await supabase.from('news').update(newsData).eq('id', editingItem.id);
    } else {
      await supabase.from('news').insert(newsData);
      
      // Send notification to all users
      const { data: allUsers } = await supabase.from('profiles').select('id');
      if (allUsers) {
        const notifications = allUsers.map(user => ({
          user_id: user.id,
          title: 'New News Post',
          message: title,
          type: 'news' as const
        }));
        await supabase.from('notifications').insert(notifications);
      }
    }
  };

  const saveLeaderboard = async () => {
    if (!teamName || !rank || !points) {
      throw new Error('All fields are required');
    }
    
    const leaderboardData = {
      team_name: teamName,
      rank: parseInt(rank),
      points: parseInt(points),
    };
    
    if (editingItem) {
      await supabase.from('leaderboard').update(leaderboardData).eq('id', editingItem.id);
    } else {
      await supabase.from('leaderboard').upsert(leaderboardData);
    }
  };

  const saveTopPlayer = async () => {
    if (!playerName || !teamName || !position || !mvpPoints) {
      throw new Error('All fields are required');
    }
    
    const topPlayerData = {
      player_name: playerName,
      team_name: teamName,
      position,
      mvp_points: parseInt(mvpPoints),
    };
    
    if (editingItem) {
      await supabase.from('top_players').update(topPlayerData).eq('id', editingItem.id);
    } else {
      await supabase.from('top_players').upsert(topPlayerData);
    }
  };

  const saveSpecialAward = async () => {
    if (!title || !awardType) {
      throw new Error('Title and award type are required');
    }
    
    const awardData = {
      award_type: awardType,
      title,
      description,
      user_id: selectedUserId || null,
      image_url: imageUrl || null,
      week_number: awardType.includes('week') ? new Date().getWeek() : null,
      month_number: awardType.includes('month') ? new Date().getMonth() + 1 : null,
      year: new Date().getFullYear(),
    };
    
    if (editingItem) {
      await supabase.from('special_awards').update(awardData).eq('id', editingItem.id);
    } else {
      await supabase.from('special_awards').insert(awardData);
    }
  };

  const saveUser = async () => {
    if (!username) throw new Error('Username is required');
    
    const userData = { 
      username, 
      role,
      age: age ? parseInt(age) : null,
      bio: bio || ''
    };
    await supabase.from('profiles').update(userData).eq('id', editingItem.id);
  };

  const handleDelete = async (item: any) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (activeTab === 'news') {
                await supabase.from('news').delete().eq('id', item.id);
              } else if (activeTab === 'leaderboard') {
                await supabase.from('leaderboard').delete().eq('id', item.id);
              } else if (activeTab === 'topPlayers') {
                await supabase.from('top_players').delete().eq('id', item.id);
              } else if (activeTab === 'awards') {
                await supabase.from('special_awards').delete().eq('id', item.id);
              }
              fetchAllData();
              Alert.alert('Success', 'Item deleted successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUrl(result.assets[0].uri);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Access Denied: Admin privileges required</Text>
      </SafeAreaView>
    );
  }

  const renderTabButton = (tab: ManagementType, label: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: any }) => (
    <View style={styles.listItem}>
      <View style={styles.itemContent}>
        {activeTab === 'news' && (
          <>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemSubtitle} numberOfLines={2}>{item.content}</Text>
          </>
        )}
        {activeTab === 'leaderboard' && (
          <>
            <Text style={styles.itemTitle}>#{item.rank} - {item.team_name}</Text>
            <Text style={styles.itemSubtitle}>{item.points} points</Text>
          </>
        )}
        {activeTab === 'topPlayers' && (
          <>
            <Text style={styles.itemTitle}>{item.player_name} - {item.team_name}</Text>
            <Text style={styles.itemSubtitle}>{item.position} • {item.mvp_points} MVP points</Text>
          </>
        )}
        {activeTab === 'awards' && (
          <>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemSubtitle}>{item.award_type.replace('_', ' ').toUpperCase()}</Text>
          </>
        )}
        {activeTab === 'users' && (
          <>
            <Text style={styles.itemTitle}>{item.username}</Text>
            <Text style={[styles.itemSubtitle, { color: item.role === 'admin' ? '#FFD700' : '#CCCCCC' }]}>
              {item.role.toUpperCase()}
            </Text>
          </>
        )}
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openModal(item)}
        >
          <Edit size={20} color="#FFD700" />
        </TouchableOpacity>
        {(activeTab !== 'users' && activeTab !== 'awards') && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={20} color="#FF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 'news': return news;
      case 'leaderboard': return leaderboard;
      case 'topPlayers': return topPlayers;
      case 'awards': return specialAwards;
      case 'users': return users;
      default: return [];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('news', 'News')}
        {renderTabButton('leaderboard', 'Leaderboard')}
        {renderTabButton('topPlayers', 'Top Players')}
        {renderTabButton('awards', 'Awards')}
        {renderTabButton('users', 'Users')}
      </View>

      <View style={styles.content}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {activeTab === 'news' && 'News Articles'}
            {activeTab === 'leaderboard' && 'Leaderboard Entries'}
            {activeTab === 'topPlayers' && 'Top Players'}
            {activeTab === 'awards' && 'Special Awards'}
            {activeTab === 'users' && 'Users'}
          </Text>
          {activeTab !== 'users' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openModal()}
            >
              <Plus size={24} color="#000000" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={getCurrentData()}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit' : 'Add'} {
                  activeTab === 'news' ? 'News' : 
                  activeTab === 'leaderboard' ? 'Leaderboard Entry' : 
                  activeTab === 'topPlayers' ? 'Top Player' : 
                  activeTab === 'awards' ? 'Special Award' : 'User'
                }
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {activeTab === 'news' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Title"
                    placeholderTextColor="#666"
                    value={title}
                    onChangeText={setTitle}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Content"
                    placeholderTextColor="#666"
                    value={content}
                    onChangeText={setContent}
                    multiline
                    numberOfLines={4}
                  />
                  <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    <Camera size={20} color="#FFD700" />
                    <Text style={styles.imageButtonText}>Add Image</Text>
                  </TouchableOpacity>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                  ) : null}
                  <TextInput
                    style={styles.input}
                    placeholder="Video URL (optional)"
                    placeholderTextColor="#666"
                    value={videoUrl}
                    onChangeText={setVideoUrl}
                  />
                </>
              )}

              {activeTab === 'leaderboard' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Team Name"
                    placeholderTextColor="#666"
                    value={teamName}
                    onChangeText={setTeamName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Rank (1-55)"
                    placeholderTextColor="#666"
                    value={rank}
                    onChangeText={setRank}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Points"
                    placeholderTextColor="#666"
                    value={points}
                    onChangeText={setPoints}
                    keyboardType="numeric"
                  />
                </>
              )}

              {activeTab === 'topPlayers' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Player Name"
                    placeholderTextColor="#666"
                    value={playerName}
                    onChangeText={setPlayerName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Team Name"
                    placeholderTextColor="#666"
                    value={teamName}
                    onChangeText={setTeamName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Position"
                    placeholderTextColor="#666"
                    value={position}
                    onChangeText={setPosition}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="MVP Points"
                    placeholderTextColor="#666"
                    value={mvpPoints}
                    onChangeText={setMvpPoints}
                    keyboardType="numeric"
                  />
                </>
              )}

              {activeTab === 'awards' && (
                <>
                  <Text style={styles.inputLabel}>Award Type</Text>
                  <View style={styles.awardTypeSelection}>
                    {[
                      { key: 'player_of_week', label: 'Player of the Week' },
                      { key: 'player_of_month', label: 'Player of the Month' },
                      { key: 'leader_of_week', label: 'Leader of the Week' }
                    ].map((award) => (
                      <TouchableOpacity
                        key={award.key}
                        style={[
                          styles.awardTypeOption,
                          awardType === award.key && styles.selectedAwardTypeOption
                        ]}
                        onPress={() => setAwardType(award.key as any)}
                      >
                        <Text style={[
                          styles.awardTypeOptionText,
                          awardType === award.key && styles.selectedAwardTypeOptionText
                        ]}>
                          {award.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Award Title"
                    placeholderTextColor="#666"
                    value={title}
                    onChangeText={setTitle}
                  />
                  
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description"
                    placeholderTextColor="#666"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                  />
                  
                  <Text style={styles.inputLabel}>Select User (Optional)</Text>
                  <View style={styles.userSelection}>
                    <TouchableOpacity
                      style={[
                        styles.userOption,
                        !selectedUserId && styles.selectedUserOption
                      ]}
                      onPress={() => setSelectedUserId('')}
                    >
                      <Text style={[
                        styles.userOptionText,
                        !selectedUserId && styles.selectedUserOptionText
                      ]}>
                        No specific user
                      </Text>
                    </TouchableOpacity>
                    {users.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.userOption,
                          selectedUserId === user.id && styles.selectedUserOption
                        ]}
                        onPress={() => setSelectedUserId(user.id)}
                      >
                        <Text style={[
                          styles.userOptionText,
                          selectedUserId === user.id && styles.selectedUserOptionText
                        ]}>
                          {user.username}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    <Camera size={20} color="#FFD700" />
                    <Text style={styles.imageButtonText}>Add Award Image</Text>
                  </TouchableOpacity>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                  ) : null}
                </>
              )}

              {activeTab === 'users' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#666"
                    value={username}
                    onChangeText={setUsername}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Age"
                    placeholderTextColor="#666"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Bio"
                    placeholderTextColor="#666"
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={3}
                  />
                  <Text style={styles.inputLabel}>Role</Text>
                  <View style={styles.roleSelection}>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        role === 'user' && styles.selectedRoleOption
                      ]}
                      onPress={() => setRole('user')}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        role === 'user' && styles.selectedRoleOptionText
                      ]}>
                        User
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        role === 'admin' && styles.selectedRoleOption
                      ]}
                      onPress={() => setRole('admin')}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        role === 'admin' && styles.selectedRoleOptionText
                      ]}>
                        Admin
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Add Date.prototype.getWeek() extension
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function() {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#FFD700',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  activeTabButtonText: {
    color: '#000000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#FFD700',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  itemActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalForm: {
    padding: 20,
    maxHeight: 400,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  imageButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  userSelection: {
    marginBottom: 16,
    maxHeight: 150,
  },
  userOption: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  selectedUserOption: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD700',
  },
  userOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  selectedUserOptionText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  awardTypeSelection: {
    marginBottom: 16,
  },
  awardTypeOption: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  selectedAwardTypeOption: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD700',
  },
  awardTypeOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  selectedAwardTypeOptionText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  roleSelection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  selectedRoleOption: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD700',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  selectedRoleOptionText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});
            <Text style={styles.itemSubtitle}>{item.mvp_points} MVP points</Text>
          </>
        )}
        {activeTab === 'users' && (
          <>
            <Text style={styles.itemTitle}>{item.username}</Text>
            <Text style={[styles.itemSubtitle, { color: item.role === 'admin' ? '#FFD700' : '#CCCCCC' }]}>
              {item.role.toUpperCase()}
            </Text>
          </>
        )}
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openModal(item)}
        >
          <Edit size={20} color="#FFD700" />
        </TouchableOpacity>
        {activeTab !== 'users' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={20} color="#FF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 'news': return news;
      case 'leaderboard': return leaderboard;
      case 'topPlayers': return topPlayers;
      case 'users': return users;
      default: return [];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('news', 'News')}
        {renderTabButton('leaderboard', 'Leaderboard')}
        {renderTabButton('topPlayers', 'Top Players')}
        {renderTabButton('awards', 'Awards')}
        {renderTabButton('users', 'Users')}
      </View>

      <View style={styles.content}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {activeTab === 'news' && 'News Articles'}
            {activeTab === 'leaderboard' && 'Leaderboard Entries'}
            {activeTab === 'topPlayers' && 'Top Players'}
            {activeTab === 'awards' && 'Special Awards'}
            {activeTab === 'users' && 'Users'}
          </Text>
          {activeTab !== 'users' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openModal()}
            >
              <Plus size={24} color="#000000" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={getCurrentData()}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit' : 'Add'} {activeTab === 'news' ? 'News' : activeTab === 'leaderboard' ? 'Leaderboard Entry' : activeTab === 'topPlayers' ? 'Top Player' : 'User'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {activeTab === 'news' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Title"
                    placeholderTextColor="#666"
                    value={title}
                    onChangeText={setTitle}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Content"
                    placeholderTextColor="#666"
                    value={content}
                    onChangeText={setContent}
                    multiline
                    numberOfLines={4}
                  />
                </>
              )}

              {(activeTab === 'leaderboard' || activeTab === 'topPlayers') && (
                <>
                  <Text style={styles.inputLabel}>Select User</Text>
                  <View style={styles.userSelection}>
                    {users.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.userOption,
                          selectedUserId === user.id && styles.selectedUserOption
                        ]}
                        onPress={() => setSelectedUserId(user.id)}
                      >
                        <Text style={[
                          styles.userOptionText,
                          selectedUserId === user.id && styles.selectedUserOptionText
                        ]}>
                          {user.username}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {activeTab === 'leaderboard' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Rank"
                    placeholderTextColor="#666"
                    value={rank}
                    onChangeText={setRank}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Points"
                    placeholderTextColor="#666"
                    value={points}
                    onChangeText={setPoints}
                    keyboardType="numeric"
                  />
                </>
              )}

              {activeTab === 'topPlayers' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="MVP Points"
                    placeholderTextColor="#666"
                    value={mvpPoints}
                    onChangeText={setMvpPoints}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Position"
                    placeholderTextColor="#666"
                    value={position}
                    onChangeText={setPosition}
                    keyboardType="numeric"
                  />
                </>
              )}

              {activeTab === 'users' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#666"
                    value={username}
                    onChangeText={setUsername}
                  />
                  <Text style={styles.inputLabel}>Role</Text>
                  <View style={styles.roleSelection}>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        role === 'user' && styles.selectedRoleOption
                      ]}
                      onPress={() => setRole('user')}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        role === 'user' && styles.selectedRoleOptionText
                      ]}>
                        User
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        role === 'admin' && styles.selectedRoleOption
                      ]}
                      onPress={() => setRole('admin')}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        role === 'admin' && styles.selectedRoleOptionText
                      ]}>
                        Admin
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#FFD700',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  activeTabButtonText: {
    color: '#000000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#FFD700',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  itemActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalForm: {
    padding: 20,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  userSelection: {
    marginBottom: 16,
  },
  userOption: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  selectedUserOption: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD700',
  },
  userOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  selectedUserOptionText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  roleSelection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  selectedRoleOption: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD700',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  selectedRoleOptionText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});