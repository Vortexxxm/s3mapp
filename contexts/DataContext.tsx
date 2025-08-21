import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, NewsItem, LeaderboardEntry, TopPlayer, SpecialAward, ClanJoinRequest, Notification } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface DataContextType {
  // Data states
  news: NewsItem[];
  leaderboard: LeaderboardEntry[];
  topPlayers: TopPlayer[];
  awards: SpecialAward[];
  clanRequests: ClanJoinRequest[];
  notifications: Notification[];
  
  // Loading states
  newsLoading: boolean;
  leaderboardLoading: boolean;
  playersLoading: boolean;
  awardsLoading: boolean;
  requestsLoading: boolean;
  notificationsLoading: boolean;
  
  // Refresh functions
  refreshNews: () => Promise<void>;
  refreshLeaderboard: () => Promise<void>;
  refreshTopPlayers: () => Promise<void>;
  refreshAwards: () => Promise<void>;
  refreshClanRequests: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshAll: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { session, profile } = useAuth();
  
  // Data states
  const [news, setNews] = useState<NewsItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [awards, setAwards] = useState<SpecialAward[]>([]);
  const [clanRequests, setClanRequests] = useState<ClanJoinRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Loading states
  const [newsLoading, setNewsLoading] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [awardsLoading, setAwardsLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Fetch functions with optimized loading states
  const refreshNews = useCallback(async () => {
    setNewsLoading(true);
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
      setNewsLoading(false);
    }
  }, []);

  const refreshLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
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
      setLeaderboardLoading(false);
    }
  }, []);

  const refreshTopPlayers = useCallback(async () => {
    setPlayersLoading(true);
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
      setPlayersLoading(false);
    }
  }, []);

  const refreshAwards = useCallback(async () => {
    setAwardsLoading(true);
    try {
      const { data, error } = await supabase
        .from('special_awards')
        .select('*, profiles:user_id (username)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAwards(data || []);
    } catch (error) {
      console.error('Error fetching awards:', error);
    } finally {
      setAwardsLoading(false);
    }
  }, []);

  const refreshClanRequests = useCallback(async () => {
    if (!session?.user) return;
    
    setRequestsLoading(true);
    try {
      let query = supabase
        .from('clan_join_requests')
        .select('*, profiles:user_id (username)');

      // If admin, get all requests. If user, get only their requests
      if (profile?.role === 'admin') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.eq('user_id', session.user.id).order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      setClanRequests(data || []);
    } catch (error) {
      console.error('Error fetching clan requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  }, [session?.user, profile?.role]);

  const refreshNotifications = useCallback(async () => {
    if (!session?.user) return;
    
    setNotificationsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [session?.user]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(prev => prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshNews(),
      refreshLeaderboard(),
      refreshTopPlayers(),
      refreshAwards(),
      refreshClanRequests(),
      refreshNotifications(),
    ]);
  }, [refreshNews, refreshLeaderboard, refreshTopPlayers, refreshAwards, refreshClanRequests, refreshNotifications]);

  // Initial data fetch
  useEffect(() => {
    if (session) {
      refreshAll();
    }
  }, [session, refreshAll]);

  // Setup real-time subscriptions with optimized updates
  useEffect(() => {
    if (!session) return;

    console.log('🔄 Setting up real-time subscriptions...');

    // News subscription with instant updates
    const newsSubscription = supabase
      .channel('global_news_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news' },
        (payload) => {
          console.log('📰 News update detected:', payload.eventType);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            // Add new news item instantly
            setNews(prev => [payload.new as NewsItem, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Update existing news item
            setNews(prev => prev.map(item => 
              item.id === payload.new.id ? { ...item, ...payload.new } : item
            ));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Remove deleted news item
            setNews(prev => prev.filter(item => item.id !== payload.old.id));
          } else {
            // Fallback: refresh all news
            refreshNews();
          }
        }
      )
      .subscribe();

    // Leaderboard subscription with instant updates
    const leaderboardSubscription = supabase
      .channel('global_leaderboard_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard' },
        (payload) => {
          console.log('🏆 Leaderboard update detected:', payload.eventType);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            setLeaderboard(prev => [...prev, payload.new as LeaderboardEntry].sort((a, b) => a.rank - b.rank));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setLeaderboard(prev => prev.map(item => 
              item.id === payload.new.id ? { ...item, ...payload.new } : item
            ).sort((a, b) => a.rank - b.rank));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setLeaderboard(prev => prev.filter(item => item.id !== payload.old.id));
          } else {
            refreshLeaderboard();
          }
        }
      )
      .subscribe();

    // Top players subscription with instant updates
    const playersSubscription = supabase
      .channel('global_players_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'top_players' },
        (payload) => {
          console.log('🥇 Top players update detected:', payload.eventType);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            setTopPlayers(prev => [...prev, payload.new as TopPlayer].sort((a, b) => b.mvp_points - a.mvp_points));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setTopPlayers(prev => prev.map(item => 
              item.id === payload.new.id ? { ...item, ...payload.new } : item
            ).sort((a, b) => b.mvp_points - a.mvp_points));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setTopPlayers(prev => prev.filter(item => item.id !== payload.old.id));
          } else {
            refreshTopPlayers();
          }
        }
      )
      .subscribe();

    // Special awards subscription with instant updates
    const awardsSubscription = supabase
      .channel('global_awards_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'special_awards' },
        (payload) => {
          console.log('🏅 Awards update detected:', payload.eventType);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            setAwards(prev => [payload.new as SpecialAward, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setAwards(prev => prev.map(item => 
              item.id === payload.new.id ? { ...item, ...payload.new } : item
            ));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setAwards(prev => prev.filter(item => item.id !== payload.old.id));
          } else {
            refreshAwards();
          }
        }
      )
      .subscribe();

    // Clan requests subscription with instant updates
    const requestsSubscription = supabase
      .channel('global_requests_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clan_join_requests' },
        (payload) => {
          console.log('👥 Clan requests update detected:', payload.eventType);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newRequest = payload.new as ClanJoinRequest;
            // Only add if it's relevant to current user (admin sees all, user sees only theirs)
            if (profile?.role === 'admin' || newRequest.user_id === session?.user?.id) {
              setClanRequests(prev => [newRequest, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedRequest = payload.new as ClanJoinRequest;
            if (profile?.role === 'admin' || updatedRequest.user_id === session?.user?.id) {
              setClanRequests(prev => prev.map(item => 
                item.id === updatedRequest.id ? { ...item, ...updatedRequest } : item
              ));
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setClanRequests(prev => prev.filter(item => item.id !== payload.old.id));
          } else {
            refreshClanRequests();
          }
        }
      )
      .subscribe();

    // Notifications subscription
    const notificationsSubscription = supabase
      .channel('user_notifications_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('🔔 Notifications update detected:', payload.eventType);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            setNotifications(prev => [payload.new as Notification, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setNotifications(prev => prev.map(item => 
              item.id === payload.new.id ? { ...item, ...payload.new } : item
            ));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setNotifications(prev => prev.filter(item => item.id !== payload.old.id));
          } else {
            refreshNotifications();
          }
        }
      )
      .subscribe();

    console.log('✅ All real-time subscriptions active');

    return () => {
      console.log('🔌 Cleaning up real-time subscriptions...');
      newsSubscription.unsubscribe();
      leaderboardSubscription.unsubscribe();
      playersSubscription.unsubscribe();
      awardsSubscription.unsubscribe();
      requestsSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
    };
  }, [session, profile?.role, refreshNews, refreshLeaderboard, refreshTopPlayers, refreshAwards, refreshClanRequests, refreshNotifications]);

  return (
    <DataContext.Provider
      value={{
        news,
        leaderboard,
        topPlayers,
        awards,
        clanRequests,
        notifications,
        newsLoading,
        leaderboardLoading,
        playersLoading,
        awardsLoading,
        requestsLoading,
        notificationsLoading,
        refreshNews,
        refreshLeaderboard,
        refreshTopPlayers,
        refreshAwards,
        refreshClanRequests,
        refreshNotifications,
        refreshAll,
        markNotificationAsRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};