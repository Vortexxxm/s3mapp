import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Calendar, User, ChevronRight } from 'lucide-react-native';
import { NewsItem } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import NewsDetailModal from '@/components/NewsDetailModal';
import AnimatedListItem from '@/components/AnimatedListItem';
import UpdateToast from '@/components/UpdateToast';

export default function HomeScreen() {
  const { news, newsLoading, refreshNews } = useData();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [lastNewsCount, setLastNewsCount] = useState(0);

  useEffect(() => {
    setLastNewsCount(news.length);
  }, []);

  // Show toast when new news is added
  useEffect(() => {
    if (lastNewsCount > 0 && news.length > lastNewsCount) {
      setShowUpdateToast(true);
    }
    setLastNewsCount(news.length);
  }, [news.length, lastNewsCount]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ar-SA', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const handleNewsPress = (item: NewsItem) => {
    setSelectedNews(item);
    setShowDetailModal(true);
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <AnimatedListItem delay={0}>
      <TouchableOpacity 
        style={styles.newsCard} 
        onPress={() => handleNewsPress(item)}
        activeOpacity={0.7}
      >
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.newsImage} />
        )}
        
        <View style={styles.newsContent}>
          <Text style={styles.newsTitle}>{item.title}</Text>
          
          <View style={styles.newsMetaInfo}>
            <View style={styles.metaItem}>
              <Calendar size={14} color="#DC143C" />
              <Text style={styles.metaText}>
                {formatDate(item.created_at).date} at {formatDate(item.created_at).time}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <User size={14} color="#DC143C" />
              <Text style={styles.metaText}>
                {item.profiles?.username || 'مشرف S3M'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.newsDescription}>
            {truncateText(item.content)}
          </Text>
          
          <View style={styles.readMoreContainer}>
            <ChevronRight size={16} color="#DC143C" />
            <Text style={styles.readMoreText}>اقرأ المزيد</Text>
          </View>
        </View>
      </TouchableOpacity>
    </AnimatedListItem>
  );

  return (
    <SafeAreaView style={styles.container}>
      <UpdateToast
        message="تم إضافة خبر جديد!"
        type="info"
        visible={showUpdateToast}
        onHide={() => setShowUpdateToast(false)}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>أخبار S3M HUB</Text>
      </View>
      
      <FlatList
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={newsLoading}
            onRefresh={refreshNews}
            tintColor="#FFD700"
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      <NewsDetailModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        newsItem={selectedNews}
      />
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
  listContainer: {
    padding: 20,
  },
  newsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  newsImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#333',
  },
  newsContent: {
    padding: 20,
  },
  newsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 12,
  },
  newsMetaInfo: {
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#CCCCCC',
    marginRight: 6,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  newsDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: 16,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  readMoreText: {
    fontSize: 14,
    color: '#DC143C',
    fontWeight: '600',
    marginLeft: 4,
    writingDirection: 'rtl',
  },
});