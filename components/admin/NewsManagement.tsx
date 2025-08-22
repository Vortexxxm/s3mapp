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
  Image,
  Modal,
} from 'react-native';
import { Plus, CreditCard as Edit3, Trash2, Save, X, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, NewsItem } from '@/lib/supabase';

export default function NewsManagement() {
  const { news, refreshNews } = useData();
  const { session } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setDescription('');
    setImageUrl('');
    setEditingNews(null);
  };

  const pickImage = async () => {
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
      setImageUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('خطأ', 'العنوان والمحتوى مطلوبان');
      return;
    }

    setLoading(true);
    try {
      const newsData = {
        title: title.trim(),
        content: content.trim(),
        description: description.trim(),
        image_url: imageUrl || null,
        author_id: session?.user?.id,
      };

      if (editingNews) {
        // Update existing news
        const { error } = await supabase
          .from('news')
          .update(newsData)
          .eq('id', editingNews.id);

        if (error) throw error;
        Alert.alert('نجح', 'تم تحديث الخبر بنجاح');
      } else {
        // Create new news
        const { error } = await supabase
          .from('news')
          .insert([newsData]);

        if (error) throw error;
        Alert.alert('نجح', 'تم إضافة الخبر بنجاح');
      }

      resetForm();
      setShowAddModal(false);
      refreshNews();
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: NewsItem) => {
    setEditingNews(item);
    setTitle(item.title);
    setContent(item.content);
    setDescription(item.description || '');
    setImageUrl(item.image_url || '');
    setShowAddModal(true);
  };

  const handleDelete = (item: NewsItem) => {
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
              const { error } = await supabase
                .from('news')
                .delete()
                .eq('id', item.id);

              if (error) throw error;
              Alert.alert('نجح', 'تم حذف الخبر بنجاح');
              refreshNews();
            } catch (error: any) {
              Alert.alert('خطأ', error.message);
            }
          },
        },
      ]
    );
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <View style={styles.newsCard}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.newsImage} />
      )}
      <View style={styles.newsContent}>
        <Text style={styles.newsTitle}>{item.title}</Text>
        <Text style={styles.newsDescription} numberOfLines={2}>
          {item.content}
        </Text>
        <Text style={styles.newsDate}>
          {new Date(item.created_at).toLocaleDateString('ar-SA')}
        </Text>
        
        <View style={styles.newsActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(item)}
          >
            <Edit3 size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>تعديل</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>حذف</Text>
          </TouchableOpacity>
        </View>
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
          <Text style={styles.addButtonText}>إضافة خبر جديد</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Add/Edit News Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingNews ? 'تعديل الخبر' : 'إضافة خبر جديد'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>العنوان *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="أدخل عنوان الخبر"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>الوصف المختصر</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="وصف مختصر للخبر"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>المحتوى *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="أدخل محتوى الخبر"
                placeholderTextColor="#666"
                multiline
                numberOfLines={6}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>الصورة</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <Camera size={20} color="#DC143C" />
                <Text style={styles.imagePickerText}>
                  {imageUrl ? 'تغيير الصورة' : 'إضافة صورة'}
                </Text>
              </TouchableOpacity>
              {imageUrl && (
                <Image source={{ uri: imageUrl }} style={styles.previewImage} />
              )}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {loading ? 'جاري الحفظ...' : editingNews ? 'تحديث الخبر' : 'إضافة الخبر'}
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
  newsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  newsImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#333',
  },
  newsContent: {
    padding: 16,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  newsDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  newsDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  newsActions: {
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
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#FF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DC143C',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    color: '#DC143C',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 12,
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