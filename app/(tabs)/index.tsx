import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { supabase, NewsItem } from '@/lib/supabase';

export default function HomeScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

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
    const subscription = supabase
      .channel('news_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news' },
        () => {
          fetchNews();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <View style={styles.newsCard}>
      <Text style={styles.newsTitle}>{item.title}</Text>
      <Text style={styles.newsContent}>{item.content}</Text>
      <View style={styles.newsFooter}>
        <Text style={styles.newsAuthor}>
          By {item.profiles?.username || 'Unknown'}
        </Text>
        <Text style={styles.newsDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
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
  listContainer: {
    padding: 20,
  },
  newsCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  newsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  newsContent: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsAuthor: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '500',
  },
  newsDate: {
    fontSize: 14,
    color: '#888888',
  },
});