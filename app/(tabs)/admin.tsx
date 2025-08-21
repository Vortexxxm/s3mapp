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
  I18nManager,
} from 'react-native';
import { Plus, CreditCard as Edit3, Trash2, Users, Trophy, Award, Newspaper as News, UserPlus, CheckCircle, XCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase, supabaseAdmin, NewsItem, LeaderboardEntry, TopPlayer, Profile, ClanJoinRequest } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function AdminScreen() {
  const { session, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('clan-requests');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Security check - redirect if not admin
  useEffect(() => {
    I18nManager.forceRTL(true);
    if (profile && profile.role !== 'admin') {
      Alert.alert('الوصول مرفوض', 'ليس لديك إذن للوصول إلى هذه المنطقة.');
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

  // Clan requests state
  const [clanRequests, setClanRequests] = useState<ClanJoinRequest[]>([]);

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
        case 'clan-requests':
          const { data: clanRequestsData } = await supabaseAdmin
            .from('clan_join_requests')
            .select(`
              *,
              profiles:user_id (username, avatar_url)
            `)
            .order('created_at', { ascending: false });
          setClanRequests(clanRequestsData || []);
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

  const handleClanRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    const actionText = action === 'approved' ? 'قبول' : 'رفض';
    
    Alert.alert(
      `تأكيد ${actionText} الطلب`,
      `هل أنت متأكد من رغبتك في ${actionText} هذا الطلب؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: actionText,
          style: action === 'approved' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabaseAdmin
                .from('clan_join_requests')
                .update({ status: action })
                .eq('id', requestId);

              if (error) throw error;

              Alert.alert('تم', `تم ${actionText} الطلب بنجاح!`);
              fetchData(); // Refresh the data
            } catch (error: any) {
              Alert.alert('خطأ', error.message);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      switch (modalType) {
        case 'news':
          if (!newsTitle || !newsContent || !newsDescription) {
            Alert.alert('خطأ', 'يرجى ملء العنوان والوصف والمحتوى');
            return;
          }
          
          if (!newsImage) {
            Alert.alert('خطأ', 'يرجى إضافة صورة للخبر');
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
            Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
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
            Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
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
      Alert.alert('نجح', `تم ${editingItem ? 'تحديث' : 'إنشاء'} ${modalType === 'news' ? 'الخبر' : modalType === 'leaderboard' ? 'الفريق' : 'اللاعب'} بنجاح!`);
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من رغبتك في حذف هذا ${type === 'news' ? 'الخبر' : type === 'leaderboard' ? 'الفريق' : 'اللاعب'}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
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
              Alert.alert('نجح', `تم حذف ${type === 'news' ? 'الخبر' : type === 'leaderboard' ? 'الفريق' : 'اللاعب'} بنجاح!`);
            } catch (error: any) {
              Alert.alert('خطأ', error.message);
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

  const renderClanRequestItem = ({ item }: { item: ClanJoinRequest }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.profiles?.username || 'مستخدم غير معروف'}</Text>
        <View style={styles.requestStatus}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'pending' ? '#FFD700' : item.status === 'approved' ? '#4CAF50' : '#FF4444' }
          ]}>
            {item.status === 'pending' ? 'قيد المراجعة' : item.status === 'approved' ? 'تم القبول' : 'تم الرفض'}
          </Text>
        </View>
      </View>
      
      <View style={styles.requestDetails}>
        <Text style={styles.requestLabel}>اسم المستخدم في فري فاير:</Text>
        <Text style={styles.requestValue}>{item.free_fire_username}</Text>
        
        <Text style={styles.requestLabel}>العمر:</Text>
        <Text style={styles.requestValue}>{item.age} سنة</Text>
        
        <Text style={styles.requestLabel}>سبب الانضمام:</Text>
        <Text style={styles.requestValue}>{item.reason}</Text>
        
        <Text style={styles.requestLabel}>تاريخ الطلب:</Text>
        <Text style={styles.requestValue}>
          {new Date(item.created_at).toLocaleDateString('ar-SA')} في {new Date(item.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      
      {item.status === 'pending' && (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleClanRequestAction(item.id, 'approved')}
          >
            <CheckCircle size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>قبول</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleClanRequestAction(item.id, 'rejected')}
          >
            <XCircle size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>رفض</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>لوحة تحكم الإدارة</Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('clan-requests', <UserPlus size={20} color={activeTab === 'clan-requests' ? '#FFFFFF' : '#666'} />, 'طلبات الكلان')}
        {renderTabButton('news', <News size={20} color={activeTab === 'news' ? '#FFFFFF' : '#666'} />, 'الأخبار')}
        {renderTabButton('leaderboard', <Trophy size={20} color={activeTab === 'leaderboard' ? '#FFFFFF' : '#666'} />, 'المتصدّرون')}
        {renderTabButton('players', <Award size={20} color={activeTab === 'players' ? '#FFFFFF' : '#666'} />, 'اللاعبون')}
        {renderTabButton('users', <Users size={20} color={activeTab === 'users' ? '#FFFFFF' : '#666'} />, 'المستخدمون')}
      </View>

      <View style={styles.content}>
        {activeTab !== 'users' && activeTab !== 'clan-requests' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openModal(activeTab === 'leaderboard' ? 'leaderboard' : activeTab === 'players' ? 'player' : 'news')}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>إضافة {activeTab === 'leaderboard' ? 'فريق' : activeTab === 'players' ? 'لاعب' : 'خبر'}</Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={activeTab === 'news' ? news : activeTab === 'leaderboard' ? leaderboard : activeTab === 'players' ? topPlayers : activeTab === 'users' ? users : clanRequests}
          renderItem={activeTab === 'news' ? renderNewsItem : activeTab === 'leaderboard' ? renderLeaderboardItem : activeTab === 'players' ? renderPlayerItem : activeTab === 'users' ? renderUserItem : renderClanRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'تعديل' : 'إضافة'} {modalType === 'leaderboard' ? 'فريق' : modalType === 'player' ? 'لاعب' : 'خبر'}
            </Text>

            <ScrollView style={styles.modalForm}>
              {modalType === 'news' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="عنوان الخبر"
                    placeholderTextColor="#666"
                    value={newsTitle}
                    onChangeText={setNewsTitle}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="وصف قصير (يظهر في تغذية الأخبار)"
                    placeholderTextColor="#666"
                    value={newsDescription}
                    onChangeText={setNewsDescription}
                    multiline
                    numberOfLines={2}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="محتوى الخبر الكامل (يظهر عندما ينقر المستخدمون على 'اقرأ المزيد')"
                    placeholderTextColor="#666"
                    value={newsContent}
                    onChangeText={setNewsContent}
                    multiline
                    numberOfLines={6}
                  />
                  <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    <Text style={styles.imageButtonText}>
                      {newsImage ? 'تغيير الصورة' : 'إضافة صورة (مطلوب)'}
                    </Text>
                  </TouchableOpacity>
                  {newsImage && <Image source={{ uri: newsImage }} style={styles.previewImage} />}
                </>
              )}

              {modalType === 'leaderboard' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="اسم الفريق"
                    placeholderTextColor="#666"
                    value={teamName}
                    onChangeText={setTeamName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="النقاط"
                    placeholderTextColor="#666"
                    value={points}
                    onChangeText={setPoints}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="الترتيب"
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
                    placeholder="اسم اللاعب"
                    placeholderTextColor="#666"
                    value={playerName}
                    onChangeText={setPlayerName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="اسم الفريق"
                    placeholderTextColor="#666"
                    value={playerTeam}
                    onChangeText={setPlayerTeam}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="المركز"
                    placeholderTextColor="#666"
                    value={playerPosition}
                    onChangeText={setPlayerPosition}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="نقاط أفضل لاعب"
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
               <Text style={styles.saveButtonText}>حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowModal(false);
                  clearForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              <Text style={styles.cancelButtonText}>إلغاء</Text>
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
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  itemContent: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  itemDescription: {
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  itemDate: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    writingDirection: 'rtl',
    textAlign: 'right',
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
    writingDirection: 'rtl',
    textAlign: 'right',
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
  requestStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  requestDetails: {
    marginBottom: 16,
  },
  requestLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
    marginBottom: 4,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  requestValue: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
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
    marginLeft: 6,
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
    textAlign: 'right',
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
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
  },
});