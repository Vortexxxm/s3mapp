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
import { LeaderboardEntry } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import AnimatedListItem from '@/components/AnimatedListItem';
import UpdateToast from '@/components/UpdateToast';

export default function LeaderboardScreen() {
  const { leaderboard, leaderboardLoading, refreshLeaderboard } = useData();
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [lastLeaderboardCount, setLastLeaderboardCount] = useState(0);

  useEffect(() => {
    setLastLeaderboardCount(leaderboard.length);
  }, []);

  // Show toast when leaderboard is updated
  useEffect(() => {
    if (lastLeaderboardCount > 0 && leaderboard.length !== lastLeaderboardCount) {
      setShowUpdateToast(true);
    }
    setLastLeaderboardCount(leaderboard.length);
  }, [leaderboard.length, lastLeaderboardCount]);

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
      <AnimatedListItem delay={index * 100}>
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
      </AnimatedListItem>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <UpdateToast
        message="تم تحديث ترتيب المتصدرين!"
        type="success"
        visible={showUpdateToast}
        onHide={() => setShowUpdateToast(false)}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المتصدّرون</Text>
      </View>
      
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={leaderboardLoading}
            onRefresh={refreshLeaderboard}
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
  leaderboardCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
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
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  points: {
    fontSize: 16,
    color: '#CCCCCC',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});