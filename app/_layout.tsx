import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  I18nManager,
} from 'react-native';
import { Medal } from 'lucide-react-native';
import { TopPlayer } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import AnimatedListItem from '@/components/AnimatedListItem';
import UpdateToast from '@/components/UpdateToast';

export default function TopPlayersScreen() {
  const { topPlayers, playersLoading, refreshTopPlayers } = useData();
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [lastPlayersCount, setLastPlayersCount] = useState(0);

  useEffect(() => {
    I18nManager.forceRTL(true);
    setLastPlayersCount(topPlayers.length);
  }, []);

  // Show toast when top players are updated
  useEffect(() => {
    if (lastPlayersCount > 0 && topPlayers.length !== lastPlayersCount) {
      setShowUpdateToast(true);
    }
    setLastPlayersCount(topPlayers.length);
  }, [topPlayers.length, lastPlayersCount]);

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
      <AnimatedListItem delay={index * 100}>
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
      </AnimatedListItem>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <UpdateToast
        message="تم تحديث ترتيب أفضل لاعب!"
        type="success"
        visible={showUpdateToast}
        onHide={() => setShowUpdateToast(false)}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>أفضل لاعب</Text>
        <Text style={styles.headerSubtitle}>ترتيب أفضل لاعب</Text>
      </View>
      
      <FlatList
        data={topPlayers}
        renderItem={({ item, index }) => renderTopPlayerItem({ item })({ index })}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={playersLoading}
            onRefresh={refreshTopPlayers}
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
  headerSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 4,
    writingDirection: 'rtl',
  },
  listContainer: {
    padding: 20,
  },
  playerCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
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
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  teamName: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 4,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  mvpPoints: {
    fontSize: 18,
    color: '#DC143C',
    fontWeight: '500',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});