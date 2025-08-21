import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
  FlatList,
  I18nManager,
} from 'react-native';
import { Settings, Plus, CreditCard as Edit3, Trash2, Save, X, Camera, Users, Trophy, Medal, Star } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase, Profile } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

type AdminSection = 'news' | 'leaderboard' | 'players' | 'awards' | 'users';

export default function AdminScreen() {
  const { profile } = useAuth();
  const { 
    news, 
    leaderboard, 
    topPlayers, 
    awards, 
    refreshNews, 
    refreshLeaderboard, 
    refreshTopPlayers, 
    refreshAwards,
    refreshAll 
  } = useData();
  const [activeSection, setActiveSection] = useState<AdminSection>('news');
  const [loading, setLoading] = useState(false);

  const [showNewsModal, setShowNewsModal] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    description: '',
    image_url: '',
    video_url: '',
  });

  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [editingLeaderboard, setEditingLeaderboard] = useState<LeaderboardEntry | null>(null);
  const [leaderboardForm, setLeaderboardForm] = useState({
    team_name: '',
    rank: '',
    points: '',
  });

  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<TopPlayer | null>(null);
  const [playerForm, setPlayerForm] = useState({
    player_name: '',
    team_name: '',
    position: '',
    mvp_points: '',
  });

  const [showAwardsModal, setShowAwardsModal] = useState(false);
  const [editingAward, setEditingAward] = useState<SpecialAward | null>(null);
  const [awardForm, setAwardForm] = useState({
    award_type: 'player_of_week' as 'player_of_week' | 'player_of_month' | 'leader_of_week',
    title: '',
    description: '',
    image_url: '',
    week_number: '',
    month_number: '',
  });

  // Users management
  const [users, setUsers] = useState<Profile[]>([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    role: 'user' as 'user' | 'admin',
    age: '',
    bio: '',
    avatar_url: '',
  });

  useEffect(() => {
    I18nManager.forceRTL(true);
    // Data is already being fetched by DataProvider
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const pickImage = async (callback: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'يرجى منح إذن الوصول للصور.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      callback(result.assets[0].uri);
    }
  };

  // News CRUD operations
  const handleSaveNews = async () => {
    if (!newsForm.title.trim() || !newsForm.content.trim()) {
      Alert.alert('خطأ', 'العنوان والمحتوى مطلوبان');
      return;
    }

    setLoading(true);
    try {
      const newsData = {
        title: newsForm.title.trim(),
        content: newsForm.content.trim(),
        description: newsForm.description.trim(),
        image_url: newsForm.image_url || null,
        video_url: newsForm.video_url || null,
        author_id: profile?.id,
      };

      if (editingNews) {
        const { error } = await supabase
          .from('news')
          .update(newsData)
          .eq('id', editingNews.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('news')
          .insert(newsData);
        if (error) throw error;
      }

      resetNewsForm();
      Alert.alert('نجح', editingNews ? 'تم تحديث الخبر' : 'تم إضافة الخبر');
      
      // Refresh news data to ensure consistency
      refreshNews();
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الخبر؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('news').delete().eq('id', id);
              if (error) throw error;
              Alert.alert('نجح', 'تم حذف الخبر');
              refreshNews();
            } catch (error: any) {
              Alert.alert('خطأ', error.message);
            }
          },
        },
      ]
    );
  };

  const resetNewsForm = () => {
    setNewsForm({ title: '', content: '', description: '', image_url: '', video_url: '' });
    setEditingNews(null);
    setShowNewsModal(false);
  };

  // Leaderboard CRUD operations
  const handleSaveLeaderboard = async () => {
    if (!leaderboardForm.team_name.trim() || !leaderboardForm.rank || !leaderboardForm.points) {
      Alert.alert('خطأ', 'جميع الحقول مطلوبة');
      return;
    }

    setLoading(true);
    try {
      const leaderboardData = {
        team_name: leaderboardForm.team_name.trim(),
        rank: parseInt(leaderboardForm.rank),
        points: parseInt(leaderboardForm.points),
      };

      if (editingLeaderboard) {
        const { error } = await supabase
          .from('leaderboard')
          .update(leaderboardData)
          .eq('id', editingLeaderboard.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('leaderboard')
          .insert(leaderboardData);
        if (error) throw error;
      }

      resetLeaderboardForm();
      Alert.alert('نجح', editingLeaderboard ? 'تم تحديث الترتيب' : 'تم إضافة الفريق');
      
      // Refresh leaderboard data to ensure consistency
      refreshLeaderboard();
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeaderboard = async (id: string) => {
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
              const { error } = await supabase.from('leaderboard').delete().eq('id', id);
              if (error) throw error;
              Alert.alert('نجح', 'تم حذف الفريق');
              refreshLeaderboard();
            } catch (error: any) {
              Alert.alert('خطأ', error.message);
            }
          },
        },
      ]
    );
  };

  const resetLeaderboardForm = () => {
    setLeaderboardForm({ team_name: '', rank: '', points: '' });
    setEditingLeaderboard(null);
    setShowLeaderboardModal(false);
  };

  // Top Players CRUD operations
  const handleSavePlayer = async () => {
    if (!playerForm.player_name.trim() || !playerForm.team_name.trim() || !playerForm.position.trim() || !playerForm.mvp_points) {
      Alert.alert('خطأ', 'جميع الحقول مطلوبة');
      return;
    }

    setLoading(true);
    try {
      const playerData = {
        player_name: playerForm.player_name.trim(),
        team_name: playerForm.team_name.trim(),
        position: playerForm.position.trim(),
        mvp_points: parseInt(playerForm.mvp_points),
      };

      if (editingPlayer) {
        const { error } = await supabase
          .from('top_players')
          .update(playerData)
          .eq('id', editingPlayer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('top_players')
          .insert(playerData);
        if (error) throw error;
      }

      resetPlayerForm();
      Alert.alert('نجح', editingPlayer ? 'تم تحديث اللاعب' : 'تم إضافة اللاعب');
      
      // Refresh players data to ensure consistency
      refreshTopPlayers();
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
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
              const { error } = await supabase.from('top_players').delete().eq('id', id);
              if (error) throw error;
              Alert.alert('نجح', 'تم حذف اللاعب');
              refreshTopPlayers();
            } catch (error: any) {
              Alert.alert('خطأ', error.message);
            }
          },
        },
      ]
    );
  };

  const resetPlayerForm = () => {
    setPlayerForm({ player_name: '', team_name: '', position: '', mvp_points: '' });
    setEditingPlayer(null);
    setShowPlayersModal(false);
  };

  // Special Awards CRUD operations
  const handleSaveAward = async () => {
    if (!awardForm.title.trim() || !awardForm.description.trim()) {
      Alert.alert('خطأ', 'العنوان والوصف مطلوبان');
      return;
    }

    setLoading(true);
    try {
      const awardData = {
        award_type: awardForm.award_type,
        title: awardForm.title.trim(),
        description: awardForm.description.trim(),
        image_url: awardForm.image_url || null,
        week_number: awardForm.week_number ? parseInt(awardForm.week_number) : null,
        month_number: awardForm.month_number ? parseInt(awardForm.month_number) : null,
        year: new Date().getFullYear(),
      };

      if (editingAward) {
        const { error } = await supabase
          .from('special_awards')
          .update(awardData)
          .eq('id', editingAward.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('special_awards')
          .insert(awardData);
        if (error) throw error;
      }

      resetAwardForm();
      Alert.alert('نجح', editingAward ? 'تم تحديث الجائزة' : 'تم إضافة الجائزة');
      
      // Refresh awards data to ensure consistency
      refreshAwards();
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAward = async (id: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذه الجائزة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('special_awards').delete().eq('id', id);
              if (error) throw error;
              Alert.alert('نجح', 'تم حذف الجائزة');
              refreshAwards();
            } catch (error: any) {
              Alert.alert('خطأ', error.message);
            }
          },
        },
      ]
    );
  };

  const resetAwardForm = () => {
    setAwardForm({
      award_type: 'player_of_week',
      title: '',
      description: '',
      image_url: '',
      week_number: '',
      month_number: '',
    });
    setEditingAward(null);
    setShowAwardsModal(false);
  };

  // Users CRUD operations
  const handleSaveUser = async () => {
    if (!userForm.username.trim()) {
      Alert.alert('خطأ', 'اسم المستخدم مطلوب');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        username: userForm.username.trim(),
        role: userForm.role,
        age: userForm.age ? parseInt(userForm.age) : null,
        bio: userForm.bio.trim(),
        avatar_url: userForm.avatar_url || null,
      };

      if (editingUser) {
        const { error } = await supabase
          .from('profiles')
          .update(userData)
          .eq('id', editingUser.id);
        if (error) throw error;
      }

      resetUserForm();
      Alert.alert('نجح', 'تم تحديث المستخدم');
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetUserForm = () => {
    setUserForm({ username: '', role: 'user', age: '', bio: '', avatar_url: '' });
    setEditingUser(null);
    setShowUsersModal(false);
  };

  const renderSectionButtons = () => (
    <View style={styles.sectionButtons}>
      <TouchableOpacity
        style={[styles.sectionButton, activeSection === 'news' && styles.activeSectionButton]}
        onPress={() => setActiveSection('news')}
      >
        <Text style={[styles.sectionButtonText, activeSection === 'news' && styles.activeSectionButtonText]}>
          الأخبار
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.sectionButton, activeSection === 'leaderboard' && styles.activeSectionButton]}
        onPress={() => setActiveSection('leaderboard')}
      >
        <Text style={[styles.sectionButtonText, activeSection === 'leaderboard' && styles.activeSectionButtonText]}>
          المتصدرون
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.sectionButton, activeSection === 'players' && styles.activeSectionButton]}
        onPress={() => setActiveSection('players')}
      >
        <Text style={[styles.sectionButtonText, activeSection === 'players' && styles.activeSectionButtonText]}>
          أفضل لاعب
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.sectionButton, activeSection === 'awards' && styles.activeSectionButton]}
        onPress={() => setActiveSection('awards')}
      >
        <Text style={[styles.sectionButtonText, activeSection === 'awards' && styles.activeSectionButtonText]}>
          الجوائز
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.sectionButton, activeSection === 'users' && styles.activeSectionButton]}
        onPress={() => setActiveSection('users')}
      >
        <Text style={[styles.sectionButtonText, activeSection === 'users' && styles.activeSectionButtonText]}>
          المستخدمون
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderNewsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowNewsModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>إضافة خبر</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={news}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            {item.image_url && (
              <Image source={{ uri: item.image_url }} style={styles.itemImage} />
            )}
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.content}
              </Text>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setEditingNews(item);
                    setNewsForm({
                      title: item.title,
                      content: item.content,
                      description: item.description || '',
                      image_url: item.image_url || '',
                      video_url: item.video_url || '',
                    });
                    setShowNewsModal(true);
                  }}
                >
                  <Edit3 size={16} color="#FFD700" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteNews(item.id)}
                >
                  <Trash2 size={16} color="#FF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        scrollEnabled={false}
      />
    </View>
  );

  const renderLeaderboardSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowLeaderboardModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>إضافة فريق</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>#{item.rank} - {item.team_name}</Text>
              <Text style={styles.itemDescription}>{item.points} نقطة</Text>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setEditingLeaderboard(item);
                    setLeaderboardForm({
                      team_name: item.team_name,
                      rank: item.rank.toString(),
                      points: item.points.toString(),
                    });
                    setShowLeaderboardModal(true);
                  }}
                >
                  <Edit3 size={16} color="#FFD700" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteLeaderboard(item.id)}
                >
                  <Trash2 size={16} color="#FF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        scrollEnabled={false}
      />
    </View>
  );

  const renderPlayersSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowPlayersModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>إضافة لاعب</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={topPlayers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.player_name}</Text>
              <Text style={styles.itemDescription}>
                {item.team_name} • {item.position} • {item.mvp_points} MVP
              </Text>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setEditingPlayer(item);
                    setPlayerForm({
                      player_name: item.player_name,
                      team_name: item.team_name,
                      position: item.position,
                      mvp_points: item.mvp_points.toString(),
                    });
                    setShowPlayersModal(true);
                  }}
                >
                  <Edit3 size={16} color="#FFD700" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePlayer(item.id)}
                >
                  <Trash2 size={16} color="#FF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        scrollEnabled={false}
      />
    </View>
  );

  const renderAwardsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAwardsModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>إضافة جائزة</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={awards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            {item.image_url && (
              <Image source={{ uri: item.image_url }} style={styles.itemImage} />
            )}
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <Text style={styles.awardType}>
                {item.award_type === 'player_of_week' && 'لاعب الأسبوع'}
                {item.award_type === 'player_of_month' && 'لاعب الشهر'}
                {item.award_type === 'leader_of_week' && 'قائد الأسبوع'}
              </Text>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setEditingAward(item);
                    setAwardForm({
                      award_type: item.award_type,
                      title: item.title,
                      description: item.description,
                      image_url: item.image_url || '',
                      week_number: item.week_number?.toString() || '',
                      month_number: item.month_number?.toString() || '',
                    });
                    setShowAwardsModal(true);
                  }}
                >
                  <Edit3 size={16} color="#FFD700" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteAward(item.id)}
                >
                  <Trash2 size={16} color="#FF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        scrollEnabled={false}
      />
    </View>
  );

  const renderUsersSection = () => (
    <View style={styles.section}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            {item.avatar_url && (
              <Image source={{ uri: item.avatar_url }} style={styles.userAvatar} />
            )}
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.username}</Text>
              <Text style={styles.itemDescription}>
                {item.role === 'admin' ? 'مشرف' : 'مستخدم'} • {item.age || 'غير محدد'} سنة
              </Text>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setEditingUser(item);
                    setUserForm({
                      username: item.username,
                      role: item.role,
                      age: item.age?.toString() || '',
                      bio: item.bio || '',
                      avatar_url: item.avatar_url || '',
                    });
                    setShowUsersModal(true);
                  }}
                >
                  <Edit3 size={16} color="#FFD700" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        scrollEnabled={false}
      />
    </View>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'news':
        return renderNewsSection();
      case 'leaderboard':
        return renderLeaderboardSection();
      case 'players':
        return renderPlayersSection();
      case 'awards':
        return renderAwardsSection();
      case 'users':
        return renderUsersSection();
      default:
        return renderNewsSection();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Settings size={24} color="#DC143C" />
        <Text style={styles.headerTitle}>لوحة الإدارة</Text>
      </View>

      {renderSectionButtons()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentSection()}
      </ScrollView>

      {/* News Modal */}
      <Modal visible={showNewsModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={resetNewsForm}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingNews ? 'تعديل الخبر' : 'إضافة خبر جديد'}
            </Text>
            <TouchableOpacity onPress={handleSaveNews} disabled={loading}>
              <Save size={24} color="#DC143C" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="عنوان الخبر"
              placeholderTextColor="#666"
              value={newsForm.title}
              onChangeText={(text) => setNewsForm({ ...newsForm, title: text })}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="محتوى الخبر"
              placeholderTextColor="#666"
              value={newsForm.content}
              onChangeText={(text) => setNewsForm({ ...newsForm, content: text })}
              multiline
              numberOfLines={6}
            />
            <TextInput
              style={styles.input}
              placeholder="وصف مختصر (اختياري)"
              placeholderTextColor="#666"
              value={newsForm.description}
              onChangeText={(text) => setNewsForm({ ...newsForm, description: text })}
            />
            <TouchableOpacity
              style={styles.imageButton}
              onPress={() => pickImage((uri) => setNewsForm({ ...newsForm, image_url: uri }))}
            >
              <Camera size={20} color="#DC143C" />
              <Text style={styles.imageButtonText}>إضافة صورة</Text>
            </TouchableOpacity>
            {newsForm.image_url && (
              <Image source={{ uri: newsForm.image_url }} style={styles.previewImage} />
            )}
            <TextInput
              style={styles.input}
              placeholder="رابط فيديو (اختياري)"
              placeholderTextColor="#666"
              value={newsForm.video_url}
              onChangeText={(text) => setNewsForm({ ...newsForm, video_url: text })}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Leaderboard Modal */}
      <Modal visible={showLeaderboardModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={resetLeaderboardForm}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingLeaderboard ? 'تعديل الفريق' : 'إضافة فريق جديد'}
            </Text>
            <TouchableOpacity onPress={handleSaveLeaderboard} disabled={loading}>
              <Save size={24} color="#DC143C" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="اسم الفريق"
              placeholderTextColor="#666"
              value={leaderboardForm.team_name}
              onChangeText={(text) => setLeaderboardForm({ ...leaderboardForm, team_name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="الترتيب"
              placeholderTextColor="#666"
              value={leaderboardForm.rank}
              onChangeText={(text) => setLeaderboardForm({ ...leaderboardForm, rank: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="النقاط"
              placeholderTextColor="#666"
              value={leaderboardForm.points}
              onChangeText={(text) => setLeaderboardForm({ ...leaderboardForm, points: text })}
              keyboardType="numeric"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Players Modal */}
      <Modal visible={showPlayersModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={resetPlayerForm}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingPlayer ? 'تعديل اللاعب' : 'إضافة لاعب جديد'}
            </Text>
            <TouchableOpacity onPress={handleSavePlayer} disabled={loading}>
              <Save size={24} color="#DC143C" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="اسم اللاعب"
              placeholderTextColor="#666"
              value={playerForm.player_name}
              onChangeText={(text) => setPlayerForm({ ...playerForm, player_name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="اسم الفريق"
              placeholderTextColor="#666"
              value={playerForm.team_name}
              onChangeText={(text) => setPlayerForm({ ...playerForm, team_name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="المركز"
              placeholderTextColor="#666"
              value={playerForm.position}
              onChangeText={(text) => setPlayerForm({ ...playerForm, position: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="نقاط MVP"
              placeholderTextColor="#666"
              value={playerForm.mvp_points}
              onChangeText={(text) => setPlayerForm({ ...playerForm, mvp_points: text })}
              keyboardType="numeric"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Awards Modal */}
      <Modal visible={showAwardsModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={resetAwardForm}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingAward ? 'تعديل الجائزة' : 'إضافة جائزة جديدة'}
            </Text>
            <TouchableOpacity onPress={handleSaveAward} disabled={loading}>
              <Save size={24} color="#DC143C" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>نوع الجائزة</Text>
              <View style={styles.pickerButtons}>
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    awardForm.award_type === 'player_of_week' && styles.activePickerButton,
                  ]}
                  onPress={() => setAwardForm({ ...awardForm, award_type: 'player_of_week' })}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      awardForm.award_type === 'player_of_week' && styles.activePickerButtonText,
                    ]}
                  >
                    لاعب الأسبوع
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    awardForm.award_type === 'player_of_month' && styles.activePickerButton,
                  ]}
                  onPress={() => setAwardForm({ ...awardForm, award_type: 'player_of_month' })}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      awardForm.award_type === 'player_of_month' && styles.activePickerButtonText,
                    ]}
                  >
                    لاعب الشهر
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    awardForm.award_type === 'leader_of_week' && styles.activePickerButton,
                  ]}
                  onPress={() => setAwardForm({ ...awardForm, award_type: 'leader_of_week' })}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      awardForm.award_type === 'leader_of_week' && styles.activePickerButtonText,
                    ]}
                  >
                    قائد الأسبوع
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={styles.input}
              placeholder="عنوان الجائزة"
              placeholderTextColor="#666"
              value={awardForm.title}
              onChangeText={(text) => setAwardForm({ ...awardForm, title: text })}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="وصف الجائزة"
              placeholderTextColor="#666"
              value={awardForm.description}
              onChangeText={(text) => setAwardForm({ ...awardForm, description: text })}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={styles.imageButton}
              onPress={() => pickImage((uri) => setAwardForm({ ...awardForm, image_url: uri }))}
            >
              <Camera size={20} color="#DC143C" />
              <Text style={styles.imageButtonText}>إضافة صورة</Text>
            </TouchableOpacity>
            {awardForm.image_url && (
              <Image source={{ uri: awardForm.image_url }} style={styles.previewImage} />
            )}
            {awardForm.award_type !== 'player_of_month' && (
              <TextInput
                style={styles.input}
                placeholder="رقم الأسبوع (اختياري)"
                placeholderTextColor="#666"
                value={awardForm.week_number}
                onChangeText={(text) => setAwardForm({ ...awardForm, week_number: text })}
                keyboardType="numeric"
              />
            )}
            {awardForm.award_type === 'player_of_month' && (
              <TextInput
                style={styles.input}
                placeholder="رقم الشهر (اختياري)"
                placeholderTextColor="#666"
                value={awardForm.month_number}
                onChangeText={(text) => setAwardForm({ ...awardForm, month_number: text })}
                keyboardType="numeric"
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Users Modal */}
      <Modal visible={showUsersModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={resetUserForm}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>تعديل المستخدم</Text>
            <TouchableOpacity onPress={handleSaveUser} disabled={loading}>
              <Save size={24} color="#DC143C" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="اسم المستخدم"
              placeholderTextColor="#666"
              value={userForm.username}
              onChangeText={(text) => setUserForm({ ...userForm, username: text })}
            />
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>الدور</Text>
              <View style={styles.pickerButtons}>
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    userForm.role === 'user' && styles.activePickerButton,
                  ]}
                  onPress={() => setUserForm({ ...userForm, role: 'user' })}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      userForm.role === 'user' && styles.activePickerButtonText,
                    ]}
                  >
                    مستخدم
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    userForm.role === 'admin' && styles.activePickerButton,
                  ]}
                  onPress={() => setUserForm({ ...userForm, role: 'admin' })}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      userForm.role === 'admin' && styles.activePickerButtonText,
                    ]}
                  >
                    مشرف
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={styles.input}
              placeholder="العمر"
              placeholderTextColor="#666"
              value={userForm.age}
              onChangeText={(text) => setUserForm({ ...userForm, age: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="النبذة الشخصية"
              placeholderTextColor="#666"
              value={userForm.bio}
              onChangeText={(text) => setUserForm({ ...userForm, bio: text })}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={styles.imageButton}
              onPress={() => pickImage((uri) => setUserForm({ ...userForm, avatar_url: uri }))}
            >
              <Camera size={20} color="#DC143C" />
              <Text style={styles.imageButtonText}>تغيير الصورة الشخصية</Text>
            </TouchableOpacity>
            {userForm.avatar_url && (
              <Image source={{ uri: userForm.avatar_url }} style={styles.previewAvatar} />
            )}
          </ScrollView>
        </SafeAreaView>
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
  sectionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  activeSectionButton: {
    backgroundColor: '#DC143C',
  },
  sectionButtonText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  activeSectionButtonText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC143C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  itemCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  itemImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#333',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    margin: 16,
    alignSelf: 'flex-end',
  },
  itemContent: {
    padding: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  itemDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  awardType: {
    fontSize: 12,
    color: '#DC143C',
    fontWeight: '600',
    marginBottom: 8,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  modalContent: {
    flex: 1,
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
    borderColor: '#333',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#DC143C',
    borderStyle: 'dashed',
  },
  imageButtonText: {
    color: '#DC143C',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#333',
  },
  previewAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: '#333',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 8,
    fontWeight: '500',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  activePickerButton: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  activePickerButtonText: {
    color: '#FFFFFF',
  },
});