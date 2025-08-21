import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Medal } from 'lucide-react-native';
import { supabase, TopPlayer } from '@/lib/supabase';

export default function TopPlayersScreen() {
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTopPlayers();
    setupRealtimeSubscription();
  }, []);

  const fetchTopPlayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('top_players')
        .select('*')
        .order('mvp_points', { ascending: false });

      if (error) throw error;
      setTopPlayers(data || []);
    } catch (error) {
      console.error('Error fetching top players:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('top_players_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'top_players' },
        () => {
          fetchTopPlayers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const renderTopPlayerItem = ({ item }: { item: TopPlayer }) => {
    const getPositionColor = (index: number) => {
      switch (index + 1) {
        case 1: return '#FFD700'; // Gold
        case 2: return '#C0C0C0'; // Silver
        case 3: return '#CD7F32'; // Bronze
        default: return '#FFFFFF';
      }
    };

    return ({ index }: { index: number }) => (
      <View style={styles.playerCard}>
        <View style={styles.positionContainer}>
          <Text style={[styles.position, { color: getPositionColor(index) }]}>
            #{index + 1}
          </Text>
          {index < 3 && (
            <Medal size={24} color={getPositionColor(index)} />
          )}
        </View>
        
        <View style={styles.playerInfo}>
          <Text style={styles.username}>
            {item.player_name}
          </Text>
          <Text style={styles.teamName}>{item.team_name} • {item.position}</Text>
          <Text style={styles.mvpPoints}>{item.mvp_points} MVP Points</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Top Players</Text>
        <Text style={styles.headerSubtitle}>MVP Rankings</Text>
      </View>
      
      <FlatList
        data={topPlayers}
        renderItem={({ item, index }) => renderTopPlayerItem({ item })({ index })}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchTopPlayers}
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
  headerSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
  },
  playerCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    minWidth: 70,
  },
  position: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  playerInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  teamName: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  mvpPoints: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: '500',
  },
});