import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Trophy } from 'lucide-react-native';
import { supabase, LeaderboardEntry } from '@/lib/supabase';

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    setupRealtimeSubscription();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('rank', { ascending: true });

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('leaderboard_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard' },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const getRankColor = (rank: number) => {
      switch (rank) {
        case 1: return '#FFD700'; // Gold
        case 2: return '#C0C0C0'; // Silver
        case 3: return '#CD7F32'; // Bronze
        default: return '#FFFFFF';
      }
    };

    return (
      <View style={styles.leaderboardCard}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rank, { color: getRankColor(item.rank) }]}>
            #{item.rank}
          </Text>
          {item.rank <= 3 && (
            <Trophy size={20} color={getRankColor(item.rank)} />
          )}
        </View>
        
        <View style={styles.playerInfo}>
          <Text style={styles.username}>
            {item.team_name}
          </Text>
          <Text style={styles.points}>{item.points} points</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </View>
      
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchLeaderboard}
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
  leaderboardCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  rank: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  playerInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  points: {
    fontSize: 16,
    color: '#CCCCCC',
  },
});