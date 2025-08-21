import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { X, Calendar, User } from 'lucide-react-native';
import { NewsItem } from '@/lib/supabase';

interface NewsDetailModalProps {
  visible: boolean;
  onClose: () => void;
  newsItem: NewsItem | null;
}

export default function NewsDetailModal({ visible, onClose, newsItem }: NewsDetailModalProps) {
  if (!newsItem) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ar-SA', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const { date, time } = formatDate(newsItem.created_at);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تفاصيل الخبر</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {newsItem.image_url && (
            <Image source={{ uri: newsItem.image_url }} style={styles.heroImage} />
          )}
          
          <View style={styles.articleContent}>
            <Text style={styles.title}>{newsItem.title}</Text>
            
            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Calendar size={16} color="#DC143C" />
                <Text style={styles.metaText}>{date}</Text>
              </View>
              <View style={styles.metaItem}>
                <User size={16} color="#DC143C" />
                <Text style={styles.metaText}>
                  بواسطة {newsItem.profiles?.username || 'مشرف S3M'}
                </Text>
              </View>
            </View>
            
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>نُشر في {time}</Text>
            </View>
            
            <View style={styles.contentContainer}>
              <Text style={styles.fullContent}>{newsItem.content}</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#1a1a1a',
  },
  articleContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 36,
    marginBottom: 16,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  metaInfo: {
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginRight: 8,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  timeContainer: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  contentContainer: {
    marginBottom: 40,
  },
  fullContent: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 26,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});