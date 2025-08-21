import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { Plus, CreditCard as Edit3, Trash2, Users, Trophy, Award, Newspaper as News } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase, supabaseAdmin, NewsItem, LeaderboardEntry, TopPlayer, Profile } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function AdminScreen() {
  const { session, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('news');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Security check - redirect if not admin
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have permission to access this area.');
      router.replace('/');
      return;
    }
  }, [profile]);

  // Don't render anything if not admin
  if (!profile || profile.role !== 'admin') {
    return null;
  }

  // News state
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState('');
  const [newsDescription, setNewsDescription] = useState('');
  
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [teamName, setTeamName] = useState('');
  const [points, setPoints] = useState('');
  const [rank, setRank] = useState('');
  
  // Top Players state
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [playerTeam, setPlayerTeam] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');
  const [mvpPoints, setMvpPoints] = useState('');
  
  // Users state
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      switch (activeTab) {
        case 'news':
          const { data: newsData } = await supabase.from('news').select('*').order('created_at', { ascending: false });
          setNews(newsData || []);
          break;
        case 'leaderboard':
          const { data: leaderboardData } = await supabase.from('leaderboard').select('*').order('rank');
          setLeaderboard(leaderboardData || []);
          break;
        case 'players':
          const { data: playersData } = await supabase.from('top_players').select('*').order('mvp_points', { ascending: false });
          setTopPlayers(playersData || []);
          break;
        case 'users':
          const { data: usersData } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
          setUsers(usersData || []);
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const openModal = (type: string, item?: any) => {
    setModalType(type);
    setEditingItem(item);
    
    if (item) {
      switch (type) {
        case 'news':
          setNewsTitle(item.title);
          setNewsContent(item.content);
          setNewsImage(item.image_url || '');
          setNewsDescription(item.description || '');
          break;
        case 'leaderboard':
          setTeamName(item.team_name);
          setPoints(item.points.toString());
          setRank(item.rank.toString());
          break;
        case 'player':
          setPlayerName(item.player_name);
          setPlayerTeam(item.team_name);
          setPlayerPosition(item.position);
          setMvpPoints(item.mvp_points.toString());
          break;
      }
    } else {
      clearForm();
    }
    
    setShowModal(true);
  };

  const clearForm = () => {
    setNewsTitle('');
    setNewsContent('');
    setNewsImage('');
    setNewsDescription('');
    setTeamName('');
    setPoints('');
    setRank('');
    setPlayerName('');
    setPlayerTeam('');
    setPlayerPosition('');
    setMvpPoints('');
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      setNewsImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      switch (modalType) {
        case 'news':
          if (!newsTitle || !newsContent || !newsDescription) {
            Alert.alert('Error', 'Please fill in title, description, and content');
            return;
          }
          
          if (!newsImage) {
            Alert.alert('Error', 'Please add an image for the news post');
            return;
          }
          
          const newsData = {
            title: newsTitle,
            content: newsContent,
            description: newsDescription,
            image_url: newsImage || null,
            author_id: session?.user?.id || null,
          };

          if (editingItem) {
            const { error } = await supabaseAdmin.from('news').update(newsData).eq('id', editingItem.id);
            if (error) throw error;
          } else {
            const { error } = await supabaseAdmin.from('news').insert(newsData);
            if (error) throw error;
          }
          break;

        case 'leaderboard':
          if (!teamName || !points || !rank) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
          }
          
          const leaderboardData = {
            team_name: teamName,
            points: parseInt(points),
            rank: parseInt(rank),
          };

          if (editingItem) {
            const { error } = await supabaseAdmin.from('leaderboard').update(leaderboardData).eq('id', editingItem.id);
            if (error) throw error;
          } else {
            const { error } = await supabaseAdmin.from('leaderboard').insert(leaderboardData);
            if (error) throw error;
          }
          break;

        case 'player':
          if (!playerName || !playerTeam || !playerPosition || !mvpPoints) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
          }
          
          const playerData = {
            player_name: playerName,
            team_name: playerTeam,
            position: playerPosition,
            mvp_points: parseInt(mvpPoints),
          };

          if (editingItem) {
            const { error } = await supabaseAdmin.from('top_players').update(playerData).eq('id', editingItem.id);
            if (error) throw error;
          } else {
            const { error } = await supabaseAdmin.from('top_players').insert(playerData);
            if (error) throw error;
          }
          break;
      }

      setShowModal(false);
      clearForm();
      // Don't manually fetch data - real-time subscriptions will handle updates
      Alert.alert('Success', `${modalType === 'news' ? 'News' : modalType === 'leaderboard' ? 'Team' : 'Player'} ${editingItem ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete this ${type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              switch (type) {
                case 'news':
                  const { error: newsError } = await supabaseAdmin.from('news').delete().eq('id', id);
                  if (newsError) throw newsError;
                  break;
                case 'leaderboard':
                  const { error: leaderboardError } = await supabaseAdmin.from('leaderboard').delete().eq('id', id);
                  if (leaderboardError) throw leaderboardError;
                  break;
                case 'player':
                  const { error: playerError } = await supabaseAdmin.from('top_players').delete().eq('id', id);
                  if (playerError) throw playerError;
                  break;
              }
              // Don't manually fetch data - real-time subscriptions will handle updates
              Alert.alert('Success', `${type} deleted successfully!`);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderTabButton = (tab: string, icon: any, title: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
    >
      {icon}
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <View style={styles.itemCard}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.itemImage} />
      )}
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <View style={styles.itemActions}>
          <TouchableOpacity onPress={() => openModal('news', item)}>
            <Edit3 size={20} color="#DC143C" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete('news', item.id)}>
            <Trash2 size={20} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
      {item.description && (
        <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
      )}
      <Text style={styles.itemContent} numberOfLines={3}>{item.content}</Text>
      <Text style={styles.itemDate}>
        {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>#{item.rank} {item.team_name}</Text>
        <View style={styles.itemActions}>
          <TouchableOpacity onPress={() => openModal('leaderboard', item)}>
            <Edit3 size={20} color="#DC143C" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete('leaderboard', item.id)}>
            <Trash2 size={20} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.itemContent}>{item.points} points</Text>
    </View>
  );

  const renderPlayerItem = ({ item }: { item: TopPlayer }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.player_name}</Text>
        <View style={styles.itemActions}>
          <TouchableOpacity onPress={() => openModal('player', item)}>
            <Edit3 size={20} color="#DC143C" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete('player', item.id)}>
            <Trash2 size={20} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.itemContent}>{item.team_name} • {item.position}</Text>
      <Text style={styles.mvpPoints}>{item.mvp_points} MVP Points</Text>
    </View>
  );

  const renderUserItem = ({ item }: { item: Profile }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.username}</Text>
        <Text style={[styles.roleText, item.role === 'admin' && styles.adminRole]}>
          {item.role.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.itemContent}>Age: {item.age || 'Not set'}</Text>
      <Text style={styles.itemContent}>Joined: {new Date(item.created_at).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('news', <News size={20} color={activeTab === 'news' ? '#FFFFFF' : '#666'} />, 'News')}
        {renderTabButton('leaderboard', <Trophy size={20} color={activeTab === 'leaderboard' ? '#FFFFFF' : '#666'} />, 'Leaderboard')}
        {renderTabButton('players', <Award size={20} color={activeTab === 'players' ? '#FFFFFF' : '#666'} />, 'Players')}
        {renderTabButton('users', <Users size={20} color={activeTab === 'users' ? '#FFFFFF' : '#666'} />, 'Users')}
      </View>

      <View style={styles.content}>
        {activeTab !== 'users' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openModal(activeTab === 'leaderboard' ? 'leaderboard' : activeTab === 'players' ? 'player' : 'news')}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add {activeTab === 'leaderboard' ? 'Team' : activeTab === 'players' ? 'Player' : 'News'}</Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={activeTab === 'news' ? news : activeTab === 'leaderboard' ? leaderboard : activeTab === 'players' ? topPlayers : users}
          renderItem={activeTab === 'news' ? renderNewsItem : activeTab === 'leaderboard' ? renderLeaderboardItem : activeTab === 'players' ? renderPlayerItem : renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit' : 'Add'} {modalType === 'leaderboard' ? 'Team' : modalType === 'player' ? 'Player' : 'News'}
            </Text>

            <ScrollView style={styles.modalForm}>
              {modalType === 'news' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="News Title"
                    placeholderTextColor="#666"
                    value={newsTitle}
                    onChangeText={setNewsTitle}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Short Description (appears in news feed)"
                    placeholderTextColor="#666"
                    value={newsDescription}
                    onChangeText={setNewsDescription}
                    multiline
                    numberOfLines={2}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Full News Content (appears when users click 'Read more')"
                    placeholderTextColor="#666"
                    value={newsContent}
                    onChangeText={setNewsContent}
                    multiline
                    numberOfLines={6}
                  />
                  <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    <Text style={styles.imageButtonText}>
                      {newsImage ? 'Change Image' : 'Add Image (Required)'}
                    </Text>
                  </TouchableOpacity>
                  {newsImage && <Image source={{ uri: newsImage }} style={styles.previewImage} />}
                </>
              )}

              {modalType === 'leaderboard' && (
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
                    placeholder="Points"
                    placeholderTextColor="#666"
                    value={points}
                    onChangeText={setPoints}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Rank"
                    placeholderTextColor="#666"
                    value={rank}
                    onChangeText={setRank}
                    keyboardType="numeric"
                  />
                </>
              )}

              {modalType === 'player' && (
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
                    value={playerTeam}
                    onChangeText={setPlayerTeam}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Position"
                    placeholderTextColor="#666"
                    value={playerPosition}
                    onChangeText={setPlayerPosition}
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
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowModal(false);
                  clearForm();
                }}
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
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    margin: 4,
  },
  activeTab: {
    backgroundColor: '#DC143C',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC143C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  itemContent: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  itemDate: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  itemImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  mvpPoints: {
    fontSize: 16,
    color: '#DC143C',
    fontWeight: '500',
  },
  roleText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  adminRole: {
    color: '#DC143C',
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalForm: {
    maxHeight: 400,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#DC143C',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});