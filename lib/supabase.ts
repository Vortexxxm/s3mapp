import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Profile = {
  id: string;
  username: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  age?: number;
  bio?: string;
  created_at: string;
  updated_at: string;
};

export type NewsItem = {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  video_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type LeaderboardEntry = {
  id: string;
  team_name: string;
  rank: number;
  points: number;
  created_at: string;
  updated_at: string;
};

export type TopPlayer = {
  id: string;
  player_name: string;
  team_name: string;
  position: string;
  mvp_points: number;
  created_at: string;
  updated_at: string;
};

export type SpecialAward = {
  id: string;
  award_type: 'player_of_week' | 'player_of_month' | 'leader_of_week';
  user_id?: string;
  title: string;
  description: string;
  image_url?: string;
  week_number?: number;
  month_number?: number;
  year: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'news' | 'award' | 'leaderboard';
  read: boolean;
  created_at: string;
};