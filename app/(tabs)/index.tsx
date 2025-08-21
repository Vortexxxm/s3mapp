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
import { supabase, NewsItem } from '@/lib/supabase';
import NewsDetailModal from '@/components/NewsDetailModal';

export default function HomeScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchNews();
    setupRealtimeSubscription();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news')
        .select(`
          *,
          profiles:author_id (username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const newsSubscription = supabase
      .channel('news_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news' },
        (payload) => {
          console.log('News change detected:', payload);
          // Refresh news data when any change occurs
          fetchNews();
        }
      )
      .subscribe();

    return () => {
      newsSubscription.unsubscribe();
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
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
              {item.profiles?.username || 'S3M Admin'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.newsDescription}>
          {truncateText(item.content)}
        </Text>
        
        <View style={styles.readMoreContainer}>
          <Text style={styles.readMoreText}>Read more</Text>
          <ChevronRight size={16} color="#DC143C" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>S3M HUB News</Text>
      </View>
      
      <FlatList
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchNews}
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
    marginLeft: 6,
    fontWeight: '500',
  },
  newsDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: 16,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 14,
    color: '#DC143C',
    fontWeight: '600',
    marginRight: 4,
  },
});