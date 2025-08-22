import React, { useEffect, useState } from 'react';
import { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Image,
} from 'react-native';
import { Crown } from 'lucide-react-native';
import { SpecialAward } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import AnimatedListItem from '@/components/AnimatedListItem';
import UpdateToast from '@/components/UpdateToast';

export default function LeaderAwardsScreen() {
  const { awards, awardsLoading, refreshAwards } = useData();
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [lastAwardsCount, setLastAwardsCount] = useState(0);
  const isMountedRef = useRef(true);

  // Filter awards to show only leader awards
  const leaderAwards = awards.filter(award => 
    award.award_type === 'leader_of_week' || 
    award.award_type === 'player_of_week' || 
    award.award_type === 'player_of_month'
  );

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMountedRef.current) {
      setLastAwardsCount(leaderAwards.length);
    }
  }, []);

  // Show toast when awards are updated
  useEffect(() => {
    if (isMountedRef.current && lastAwardsCount > 0 && leaderAwards.length !== lastAwardsCount) {
      setShowUpdateToast(true);
    }
    if (isMountedRef.current) {
      setLastAwardsCount(leaderAwards.length);
    }
  }, [leaderAwards.length, lastAwardsCount]);

  const getAwardTypeText = (type: string) => {
    switch (type) {
      case 'leader_of_week': return 'أفضل زعيم الأسبوع';
      case 'player_of_week': return 'أفضل لاعب الأسبوع';
      case 'player_of_month': return 'أفضل لاعب الشهر';
      default: return type;
    }
  };

  const getAwardColor = (type: string) => {
    switch (type) {
      case 'leader_of_week': return '#FFD700'; // Gold
      case 'player_of_week': return '#C0C0C0'; // Silver
      case 'player_of_month': return '#CD7F32'; // Bronze
      default: return '#FFFFFF';
    }
  };

  const renderAwardItem = ({ item, index }: { item: SpecialAward; index: number }) => (
    <AnimatedListItem delay={index * 100}>
      <View style={styles.awardCard}>
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.awardImage} />
        )}
        
        <View style={styles.awardContent}>
          <View style={styles.awardHeader}>
            <Crown size={24} color={getAwardColor(item.award_type)} />
            <Text style={[styles.awardType, { color: getAwardColor(item.award_type) }]}>
              {getAwardTypeText(item.award_type)}
            </Text>
          </View>
          
          <Text style={styles.awardTitle}>{item.title}</Text>
          <Text style={styles.awardDescription}>{item.description}</Text>
          
          <View style={styles.awardMeta}>
            {item.week_number && (
              <Text style={styles.metaText}>الأسبوع {item.week_number}</Text>
            )}
            {item.month_number && (
              <Text style={styles.metaText}>الشهر {item.month_number}</Text>
            )}
            <Text style={styles.metaText}>{item.year}</Text>
          </View>
        </View>
      </View>
    </AnimatedListItem>
  );

  return (
    <SafeAreaView style={styles.container}>
      <UpdateToast
        message="تم تحديث جوائز أفضل زعيم!"
        type="success"
        visible={showUpdateToast}
        onHide={() => setShowUpdateToast(false)}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>أفضل زعيم</Text>
        <Text style={styles.headerSubtitle}>جوائز أفضل زعيم وأفضل لاعب</Text>
      </View>
      
      <FlatList
        data={leaderAwards}
        renderItem={renderAwardItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={awardsLoading}
            onRefresh={refreshAwards}
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
  awardCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  awardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#333',
  },
  awardContent: {
    padding: 20,
  },
  awardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'flex-end',
  },
  awardType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    writingDirection: 'rtl',
  },
  awardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  awardDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: 12,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  awardMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#888',
    writingDirection: 'rtl',
  },
});